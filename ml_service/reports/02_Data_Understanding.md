## 2. Data Understanding

### Data Sources

The project combines several datasets to understand factors that influence agricultural commodity prices in Zambia.

- **Commodity Prices:** Historical monthly wholesale and retail prices from the [WFP Food Prices for Zambia](https://data.humdata.org/dataset/wfp-food-prices-for-zambia/resource/d9a34dc4-ff1d-43bf-9592-03d12d027848) and [Zambia Cost of Living Dataset (1999–2025)](https://www.kaggle.com/datasets/lightonphiri/zambia-cost-of-living-dataset-19992025).
- **Supply Data:** Regional crop yield and area harvested statistics from [ZamStats](https://www.zamstats.gov.zm/agriculture-and-environment/).
- **Macroeconomic Data:** CPI, food inflation, and other price indicators from [Zambia Open Data for Africa](https://zambia.opendataforafrica.org/ukxlqoc/prices-statistics-2012-2025), together with ZMW/USD exchange rates from the [Bank of Zambia](https://www.boz.zm/markets-securities/average-exchange-rates).
- **Environmental Data:** Satellite precipitation and NDVI data from [Humanitarian Data Exchange](https://data.humdata.org/dataset/zmb-ndvi-subnational/resource/5fd063bd-05a1-4e1f-b295-e577b47a0291).

### Data Collection

The datasets were downloaded from their respective sources and stored as raw data. The source, date range, variables, and format of each dataset were documented before processing.

### Data Exploration (EDA)

Exploratory Data Analysis was performed using Python, Pandas, and Jupyter Notebook to understand:

### Data Quality Assessment

The datasets were checked for:

The results of this phase were used to determine the cleaning and transformation required during the **Data Preparation** phase.
