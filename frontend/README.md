# MedhaX Frontend

A mobile real-time multiplayer coding quiz game built with React Native and Expo.

## Tech Stack
- **Framework**: React Native + Expo (SDK 54)
- **Styling**: NativeWind (Tailwind CSS)
- **Navigation**: React Navigation (Stack)
- **State Management**: Zustand
- **Networking**: Axios
- **Real-time**: Socket.IO Client
- **Language**: TypeScript

## Project Structure
- `src/components`: Reusable UI components
- `src/screens`: Individual game screens
- `src/navigation`: Navigation configuration and types
- `src/store`: Global state management with Zustand
- `src/services`: API and Socket services
- `src/hooks`: Custom React hooks
- `src/types`: TypeScript interfaces and types
- `src/utils`: Helper functions
- `src/constants`: Theme and global constants

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo Go app on your mobile device (to test)

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
- Start the Expo development server:
  ```bash
  npm start
  ```
- Scan the QR code with your mobile device (Expo Go app) or use an emulator.

## Environment Variables
Create a `.env` file (if needed) for backend configuration:
- `API_BASE_URL`: URL of the backend API
- `SOCKET_URL`: URL of the Socket.IO server
