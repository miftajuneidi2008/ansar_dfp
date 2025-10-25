

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Supabase Locally](#running-supabase-locally)
  - [Environment Variables](#environment-variables)
  - [Running the Next.js Application](#running-the-nextjs-application)
## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: [https://nodejs.org/](https://nodejs.org/) (LTS version recommended)
*   **npm** (comes with Node.js)
*   **Docker Desktop**: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) (Required to run local Supabase services)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/miftajuneidi2008/ansar_dfp.git
    cd ansar_dfp
    ```

2.  **Install project dependencies:**
    ```bash
    npm install
    ```

3.  **Install Supabase CLI (if not already installed globally):**
    ```bash
    npm install supabase --save-dev # or npm install -g supabase if you prefer global
    ```

### Running Supabase Locally

This project uses a local instance of Supabase for development.

1.  **Start Docker Desktop.** Ensure Docker is running before proceeding.

2. **Inistall subabse using npm:**

3.  **Initialize Supabase in your project:**
    If this is your first time setting up Supabase locally for this project, you need to initialize it. This creates the `supabase/` directory.
    ```bash
    npx supabase init
    ```
    *Note: If `supabase/` directory already exists, you can skip this step.*

4.  **Start Supabase services:**
    This command will start all the Supabase services (Postgres, Auth, Storage, etc.) as Docker containers on your machine.
    ```bash
    npx supabase start
    ```
    Upon successful execution, you will see output similar to this:

    ```
    Started Supabase local development setup.

        API URL: http://localhost:54321
        Dashboard URL: http://localhost:54323
        DB URL: postgresql://supabase_admin:[YOUR-DB-PASSWORD]@localhost:54322/postgres
        Studio URL: http://localhost:54323
        anon key: [YOUR_ANON_KEY]
        service_role key: [YOUR_SERVICE_ROLE_KEY]
    ```

    **Keep this terminal window open** as long as you are working with the local Supabase instance.

### Environment Variables

You need to configure your environment variables for the Next.js application to connect to your local Supabase instance.

1.  **copy a ` anon key`** from the `npx supabase start` output and paste into your NEXT_PUBLIC_SUPABASE_ANON_KEY (varibale is in compose.yaml) file


### Running the Next.js Application

Once Supabase is running and your environment variables are set:

1.  **Start the Next.js development server:**
    ```bash
    docker-compose up --build 
    ```

2.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.



