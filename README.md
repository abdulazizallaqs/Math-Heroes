# Math Heroes

A fun, interactive math learning application for kids! Practice addition, subtraction, and number guessing with adaptive difficulty and AI-powered question generation.

## Features

-   **Adaptive Difficulty**: The game gets harder as you score more points.
-   **AI Integration**: Generates unique questions using OpenAI or Google Gemini (if configured).
-   **Interactive Interface**: Fun sounds, animations, and immediate feedback.
-   **Multiple Modes**:
    -   Addition
    -   Subtraction
    -   Guess the Number

## � Screenshots

| Home  | Subtraction | Addition |
|:---:|:---:|:---:|
| <img src="screenshots/home.png" width="200" /> | <img src="screenshots/sub.png" width="200" /> | <img src="screenshots/add.png" width="200" /> |

## �🚀 Getting Started

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/math-heroes.git
    cd math-heroes
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  (Optional) Configure AI Keys:
    -   Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    -   Add your `OPENAI_API_KEY` or `GOOGLE_API_KEY` in the `.env` file to enable AI-generated questions.
    -   *Note: The app works with procedural generation even without API keys!*

### Running the App

Start the server:
```bash
npm start
```

Open your browser and visit: `http://localhost:3000`

## Technologies Used

-   **Frontend**: HTML, CSS, Vanilla JavaScript
-   **Backend**: Node.js, Express
-   **AI Integration**: OpenAI API, Google Gemini API

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
