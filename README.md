# private-meet

A private chat, video, and voice meeting application built with Nestjs, Handlebars, and Socket.io.

## Folders

- `src`: Contains the source code for the application.
- `public`: Contains static assets like CSS, JavaScript, and images.
- `views`: Contains Handlebars templates for rendering HTML pages.
- `src/client`: Contains client-side TypeScript code for handling real-time communication and UI interactions.

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
