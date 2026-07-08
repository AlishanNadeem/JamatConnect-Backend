# JamatConnect Backend API

This is the backend API for the **JamatConnect** community application. It provides
authentication, database integration, mailing, and other core backend services.

## Features

-   User authentication using JWT
-   MongoDB database connection
-   Email service using Nodemailer
-   Uploads folder support
-   Environment variable configuration
-   Structured API architecture

## Tech Stack

-   Node.js
-   Express.js
-   MongoDB (Mongoose)
-   Nodemailer

## Installation

    git clone <your-repository-url>
    cd JamatConnect-Backend
    npm install

## Environment Variables

Create a `.env` file in the root directory and add the following:

    PORT=8080
    BASE_URL=<base_url>
    APP_NAME=jamatconnect

    DB_CONNECTION_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net
    DB_NAME=jamatconnect

    JWT_SECRET_KEY=<your_jwt_secret_here>

    MAILING_EMAIL=<your_email_address>
    MAILING_PASSWORD=<your_email_app_password>

**Important:**\
Do not commit your `.env` file. Add `.env` to `.gitignore`.

## Project Structure

    ├── src/
    │   ├── controllers/
    │   ├── routes/
    │   ├── helpers/
    │   ├── models/
    │   ├── middleware/
    │   ├── config/
    │   └── utils/
    ├── uploads/
    ├── .gitignore
    ├── package.json
    └── README.md

## Running the Server

### Development

    npm run dev

### Production

    npm start

The server will run at:\
`http://localhost:8080`\
(or the port you set in `.env`)

API base path:\
`/{APP_NAME}/v1/api` (e.g. `/jamatconnect/v1/api`)

## Email Configuration

If using Gmail, generate an App Password and use:

    MAILING_EMAIL=<your_email>
    MAILING_PASSWORD=<your_email_app_password>

## Uploads Folder

Uploaded files are stored in:

    uploads/

Ensure this folder is included in `.gitignore`.

## Security Notes

-   Never expose real secrets publicly
-   Always use environment variables
-   Rotate keys immediately if leaked
-   Enable HTTPS in production

## License

This project is licensed under the MIT License.
