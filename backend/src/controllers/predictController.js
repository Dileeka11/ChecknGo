const { PythonShell } = require("python-shell");
const path = require("path");

/**
 * Predict fruit/vegetable from image
 * POST /api/predict
 */
const predictFruit = async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: "No image data provided",
      });
    }

    // Path to Python script
    const scriptPath = path.join(__dirname, "../../ai_model");
    const scriptName = "predict.py";

    // Configure python-shell
    const options = {
      mode: "json",
      pythonPath: "python", // Uses system Python
      scriptPath: scriptPath,
    };

    // Create a new PythonShell instance
    const pyshell = new PythonShell(scriptName, options);

    // Promise wrapper for python-shell
    const result = await new Promise((resolve, reject) => {
      let output = null;

      pyshell.on("message", (message) => {
        output = message;
      });

      pyshell.on("error", (err) => {
        reject(err);
      });

      pyshell.on("close", () => {
        if (output) {
          resolve(output);
        } else {
          reject(new Error("No output from Python script"));
        }
      });

      // Send image data to Python script
      pyshell.send(JSON.stringify({ imageData }));
      pyshell.end((err) => {
        if (err) reject(err);
      });
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Prediction failed",
    });
  }
};

module.exports = {
  predictFruit,
};
