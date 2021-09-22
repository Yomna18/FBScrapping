import pandas as pd

df = pd.read_json('D:\\Visual Studio Code Projects\\FBScrapping\\Testing.json')

df.to_excel('D:\\DataScrapped2.xlsx')