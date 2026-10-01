import { Image, type ImageStyle, type StyleProp } from "react-native";

export type AppLogoIconName = "icon";

type AppLogoIconProps = {
    name?: AppLogoIconName;
    size?: number;
    style?: StyleProp<ImageStyle>;
};

export function AppLogoIcon({ size = 40, style }: AppLogoIconProps) {
    return (
        <Image
            source={require("@/assets/images/logo.png")}
            style={[
                {
                    width: size,
                    height: size,
                    resizeMode: "contain",
                },
                style,
            ]}
        />
    );
}
