import time

from selenium.webdriver.common.by import By
from selenium import webdriver
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service

import pandas as pd
from selenium.webdriver.support.wait import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager



verbose_=True
chrome_service = None


def worker(ticker):
    global verbose_
    if verbose_:
        print(f"started  {ticker}")
    time1=time.time()
    url= baseurl = "https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=" + ticker
    options = webdriver.ChromeOptions()


    driver = webdriver.Chrome(service=chrome_service ,options=options)
    driver.get(url)
    #wait until the button appears
    WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.XPATH, '//*[@id="MainContent_RadioButtonListPeriod_7"]')))

    # find the button and click it
    button = driver.find_element(By.XPATH,'//*[@id="MainContent_RadioButtonListPeriod_7"]')
    button.click()
    time.sleep(3)
    js_script = """
    var data = chartMainContent_FonFiyatGrafik.xAxis[0].categories;
    return data;
    """

    date_series = driver.execute_script(js_script)


    js_script = """
     const dataArray = chartMainContent_FonFiyatGrafik.series[0].data;
const prices = dataArray.map(dataPoint => dataPoint.y);
return prices;
    """
    price_data = driver.execute_script(js_script)
    driver.quit()
    time2=time.time()
    if verbose_:
        print(f"finished {ticker}, time= {time2-time1}")

    return date_series, price_data

def get_data(*tickers,verbose=True):
    global verbose_
    verbose_=verbose

    tickers=list(tickers)
    if verbose_:
        print("Ticker list:")
        print(tickers)
    global chrome_service
    chrome_service = Service(ChromeDriverManager().install())
    if verbose_:

        print("installed chrome driver")

    # Initialize an empty dataframe
    df = pd.DataFrame()

    # Loop over each ticker
    for ticker in tickers:
        times, prices = worker(ticker)

        # Check if df is empty then initialize it, otherwise add the new data as a new column
        if df.empty:
            df = pd.DataFrame(prices, index=times, columns=[ticker])
        else:
            df[ticker] = pd.Series(prices, index=times)

    return df



if __name__ == '__main__':
    get_data("AEH", "VEH")