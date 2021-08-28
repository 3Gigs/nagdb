# Not Another Generic Discord Bot!  
A Discord Bot with written with Discord.py  
Uses Google style for docstrings & stuff  
## Running
1. Clone this repository and cd into cloned directory
```git clone https://github.com/nagdb```  
```cd ./nagdb```  
2. Create a virtual environment for Python to setup dependencies  
```python -m venv bot-env```
3. Activate it using  
**Linux**  
```source bot-env/bin/activate```  
**Windows**  
```bot-env\Scripts\Activate.bat```  
4. Install dependencies  
```pip install -r requirements.txt```  
6. Create .env and write with this format  
```DISCORD_TOKEN={DISCORD_TOKEN (No brackets, just the token)}```
5. Run discord bot  
```python3 ./nagdb.py```  
## Using Docker  
Install Docker and Docker-compose  
1. Clone this respository  
```git clone https://github.com/nagdb```  
```cd ./nagdb```  
2. Create a virtual environment for Python to setup dependencies  
2. Create .env and write with this format  
```DISCORD_TOKEN={DISCORD_TOKEN (No brackets, just the token)}```
3. Compose discord bot  
```docker-compose up```