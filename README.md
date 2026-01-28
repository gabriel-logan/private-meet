# Private Meet

# OBS: NOT WORKING, IN PROGRESS

A private chat, video, and voice meeting application built with Nestjs, Handlebars, WebRTC, and WebSockets(Socket.io).
Free, open-source, and self-hostable.

## Purpose

Private Meet is designed to provide a secure and frictionless way to connect with others without the need for accounts or metadata collection. It emphasizes end-to-end confidentiality, structured access control, and transparent technology that users can fully trust.

## Public Demo

You can try out a live demo of Private Meet at [https://private-meet-76by.onrender.com](https://private-meet-76by.onrender.com).
This demo is hosted on Render.com and may have limitations on usage.
We are not using TURN servers, so connectivity may vary based on your network conditions.
We are using free instances, so performance may vary.

## Features

- No accounts required — create or join a room instantly.
- Flexible room identifiers — define IDs with 1 to 128 characters, or generate unguessable ones via UUID v4.
- End-to-end encrypted chat for private messaging.
- WebRTC-based voice, video, and screen sharing, with low latency and peer-to-peer security.
- Unlimited participants in each room.
- Structured access control to manage entry and participation.
- Open source freedom — anyone can clone, self-host, and redeploy Private Meet on their own infrastructure.

## Folders

- `src`: Contains the source code for the application.
- `public`: Contains static assets like CSS, JavaScript, and images.
- `views`: Contains Handlebars templates for rendering HTML pages.
- `src/client`: Contains client-side TypeScript code for handling real-time communication and UI interactions.
- `secrets`: Contains SSL certificates and private keys for HTTPS support.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/private-meet.git
   ```
2. Navigate to the project directory:
   ```bash
   cd private-meet
   ```
3. Install the dependencies:
   ```bash
   yarn install
   ```

## Setup

1. Create a `.env` file in the root directory and add the following environment variables:
   ```bash
   copy .env.example .env
   ```
2. Update the `.env` file with your configuration.

## Running the Application

1. Start the development server:
   ```bash
   yarn dev
   ```

## Building for Production

1. Build the application:
   ```bash
   yarn build
   ```
2. Start the production server:
   ```bash
   yarn start
   ```

## Testing

1. Run the tests:
   ```bash
   yarn test
   ```

## License

This project is licensed under the AGPL-3.0 License.
See the [LICENSE](LICENSE) file for details.
