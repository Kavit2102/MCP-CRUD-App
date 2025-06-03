// Import necessary modules
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fsPromises from "fs/promises";
import path from "path";

// Create server instance
const server = new McpServer({
  name: "CRUD",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Create new item
server.tool(
  "create-file",
  "Create a file with the given content",
  {
    title: z.string().nonempty("Title is required"),
    description: z.string().nonempty("Description is required"),
    name: z.string().nonempty("Name is required"),
  },
  async ({ title, description, name }, context) => {
    try {
      const prompt = context._meta?.prompt || "No prompt provided";

      console.log("Received prompt:", prompt);
      // Check for missing fields
      const missingFields: Array<string> = [];
      if (!name) missingFields.push("name");
      if (!title) missingFields.push("title");
      if (!description) missingFields.push("description");

      if (missingFields.length > 0) {
        // Create a more conversational message
        let message = "I noticed you haven't provided ";

        if (missingFields.length === 1) {
          message += `the ${missingFields[0]}. Would you like to add it to complete the file creation?`;
        } else {
          const lastField = missingFields.pop();
          message += `${missingFields.join(
            ", "
          )} and ${lastField}. Would you like to add these to complete the file creation?`;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: message,
            },
          ],
        };
      }

      // Check if any field is empty after trimming
      // if (!title.trim() || !description.trim() || !name.trim()) {
      //   return {
      //     content: [
      //       {
      //         type: "text" as const,
      //         text: "All fields must contain non-empty values!",
      //       },
      //     ],
      //   };
      // }

      // Generate a userID using part of UUID
      const userId = crypto.randomUUID().slice(0, 16);

      // Create the file content
      const fileContent = JSON.stringify(
        { userId, title, description, name },
        null,
        2
      );

      // Set the exact file path as requested
      const filePath = path.join(
        "C:",
        "Users",
        "tcs",
        "Desktop",
        "VS Code",
        "mcp-main",
        "uploads",
        "users",
        `${userId}.json`
      );

      // Ensure the uploads/users directory exists
      await fsPromises.mkdir(path.dirname(filePath), { recursive: true });

      // Write the file
      await fsPromises.writeFile(filePath, fileContent);

      return {
        content: [
          {
            type: "text" as const,
            text: `File created successfully at ${filePath}\n\nContent:\n${fileContent}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error writing file:", error);
      const errorMessage =
        error instanceof Error ? error.message : "unknown error";
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to create file: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// List all files
server.tool(
  "list-files",
  "List all files in the users directory",
  {},
  async () => {
    try {
      const dirPath = path.join(
        "C:",
        "Users",
        "tcs",
        "Desktop",
        "VS Code",
        "mcp-main",
        "uploads",
        "users"
      );

      const files = await fsPromises.readdir(dirPath);
      const fileContents = await Promise.all(
        files.map(async (file) => {
          const content = await fsPromises.readFile(
            path.join(dirPath, file),
            "utf-8"
          );
          return JSON.parse(content);
        })
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(fileContents, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error listing files:", error);
      const errorMessage =
        error instanceof Error ? error.message : "unknown error";
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to list files: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Get specific file
server.tool(
  "get-file",
  "Get a specific file by ID",
  {
    id: z.string(),
  },
  async ({ id }) => {
    try {
      const filePath = path.join(
        "C:",
        "Users",
        "tcs",
        "Desktop",
        "VS Code",
        "mcp-main",
        "uploads",
        "users",
        `${id}.json`
      );

      const fileContent = await fsPromises.readFile(filePath, "utf-8");
      return {
        content: [
          {
            type: "text" as const,
            text: fileContent,
          },
        ],
      };
    } catch (error) {
      console.error("Error reading file:", error);
      const errorMessage =
        error instanceof Error ? error.message : "unknown error";
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to read file: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Update specific file
server.tool(
  "update-file",
  "Update a specific file by ID",
  {
    id: z.string(),
    title: z.string(),
    description: z.string(),
    name: z.string(),
  },
  async ({ id, title, description, name }) => {
    try {
      const filePath = path.join(
        "C:",
        "Users",
        "tcs",
        "Desktop",
        "VS Code",
        "mcp-main",
        "uploads",
        "users",
        `${id}.json`
      );

      const fileContent = JSON.stringify(
        { userId: id, title, description, name },
        null,
        2
      );

      await fsPromises.writeFile(filePath, fileContent);

      return {
        content: [
          {
            type: "text" as const,
            text: `File updated successfully at ${filePath}\n\nNew Content:\n${fileContent}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error updating file:", error);
      const errorMessage =
        error instanceof Error ? error.message : "unknown error";
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to update file: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Delete specific file
server.tool(
  "delete-file",
  "Delete a specific file by ID",
  {
    id: z.string(),
  },
  async ({ id }) => {
    try {
      const filePath = path.join(
        "C:",
        "Users",
        "tcs",
        "Desktop",
        "VS Code",
        "mcp-main",
        "uploads",
        "users",
        `${id}.json`
      );

      await fsPromises.unlink(filePath);

      return {
        content: [
          {
            type: "text" as const,
            text: `File deleted successfully: ${id}.json`,
          },
        ],
      };
    } catch (error) {
      console.error("Error deleting file:", error);
      const errorMessage =
        error instanceof Error ? error.message : "unknown error";
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to delete file: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

async function main() {
  // Start both stdio and HTTP servers
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
