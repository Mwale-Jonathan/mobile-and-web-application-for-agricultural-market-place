import { api, ApiError, buildProductForm, configureApiAuth } from "@/lib/api";
import { toUploadAsset } from "@/lib/image-upload";
import { mlApi } from "@/lib/ml-api";

const fetchMock = jest.fn();

function expressResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

function mlResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  configureApiAuth(null, () => undefined);
});

test("authenticated Express requests include the bearer token", async () => {
  configureApiAuth("jwt-token");
  fetchMock.mockResolvedValue(expressResponse(200, { id: "user-1", name: "Farmer" }));

  await api.me();

  const options = fetchMock.mock.calls[0][1] as RequestInit;
  expect((options.headers as Headers).get("Authorization")).toBe("Bearer jwt-token");
});

test("an authenticated 401 invokes the session invalidation handler", async () => {
  const onUnauthorized = jest.fn();
  configureApiAuth("expired", onUnauthorized);
  fetchMock.mockResolvedValue(expressResponse(401, { error: "Invalid token" }));

  await expect(api.me()).rejects.toEqual(expect.objectContaining({ status: 401, message: "Invalid token" }));
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});

test("Express network failures are normalized", async () => {
  fetchMock.mockRejectedValue(new TypeError("Network request failed"));
  await expect(api.products()).rejects.toEqual(expect.objectContaining({
    name: "ApiError",
    status: 0,
    message: "Unable to reach the AgriMart server.",
  }));
});

test("FastAPI detail errors preserve closest commodity suggestions", async () => {
  fetchMock.mockResolvedValue(mlResponse(404, {
    detail: { error: "No commodity matches 'miaz'", closest: ["Maize"] },
  }));

  try {
    await mlApi.predict("miaz", "Lusaka");
    throw new Error("Expected prediction to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).details).toEqual(expect.objectContaining({ closest: ["Maize"] }));
  }
});

test("photo validation rejects oversized and unsupported images", () => {
  expect(() => toUploadAsset({
    uri: "file:///large.jpg",
    fileName: "large.jpg",
    mimeType: "image/jpeg",
    fileSize: 5 * 1024 * 1024 + 1,
    width: 100,
    height: 100,
  })).toThrow("5MB");

  expect(() => toUploadAsset({
    uri: "file:///photo.heic",
    fileName: "photo.heic",
    mimeType: "image/heic",
    width: 100,
    height: 100,
  })).toThrow("JPEG, PNG, GIF, or WebP");
});

test("product multipart payload includes fields and a native image part", () => {
  const file = new Blob(["image-bytes"], { type: "image/jpeg" });
  const form = buildProductForm(
    { name: "Tomatoes", price: 20 },
    { uri: "file:///tomatoes.jpg", name: "tomatoes.jpg", type: "image/jpeg", file },
  );
  const parts = Array.from(form.entries());

  expect(parts).toEqual(expect.arrayContaining([
    ["name", "Tomatoes"],
    ["price", "20"],
  ]));
  expect(parts.find(([key]) => key === "image")?.[1]).toEqual(expect.objectContaining({ type: "image/jpeg" }));
});
