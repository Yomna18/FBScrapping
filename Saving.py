import pandas as pd

df = pd.read_json('D:\\Visual Studio Code Projects\\FBScrapping\\Myjson.json')

df.to_excel('D:\\DataScrapped.xlsx')