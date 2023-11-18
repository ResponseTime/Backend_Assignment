# Backend_Assignment

Steps to run the API in docker container
- Clone the git repository
- Run `npm install` to install all the packages needed
- Run `docker-compose up --build` to build the docker images **(should have docker installed)**
- Postman can be used for testing the api endpoints

Authentication System:
- Used json web tokens for authentication
- Bcryptjs for encrypting the password and store them in the db
- Created middleware function to verify json web token

Multer setup:
- Used multer memory storage to process the excel files
- FileFilter -> only takes excel files
- Would prefer disk storage if the api runs in a concurrent environment 
