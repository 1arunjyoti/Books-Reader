const path = require('path');
const fs = require('fs');
const logger = require('./logger');

/**
 * Security utilities for command execution validation
 */

/**
 * Validates and returns a safe Python executable path
 * Prevents command injection by validating the executable
 * 
 * @param {string} pythonPath - Python path from environment or default
 * @returns {Promise<string>} Validated Python executable path
 * @throws {Error} If Python executable is invalid or not found
 */
async function validatePythonExecutable(pythonPath) {
  if (!pythonPath) {
    throw new Error('Python executable path is required');
  }

  // Extract basename to check against allowed commands
  const basename = path.basename(pythonPath).toLowerCase();
  
  // List of valid Python executable names
  const validPythonCommands = [
    'python',
    'python3',
    'python.exe',
    'python3.exe',
    'python2',
    'python2.exe'
  ];

  // Check if basename is in allowed list
  if (!validPythonCommands.includes(basename)) {
    logger.error('Invalid Python executable name', { 
      provided: basename,
      allowed: validPythonCommands 
    });
    throw new Error(`Invalid Python executable: ${basename}. Must be one of: ${validPythonCommands.join(', ')}`);
  }

  // If a custom path is provided (not just 'python'), validate it exists
  if (pythonPath !== basename) {
    // Ensure path is absolute
    const absolutePath = path.isAbsolute(pythonPath) ? pythonPath : path.resolve(pythonPath);
    
    // Check if file exists
    try {
      await fs.promises.access(absolutePath, fs.constants.X_OK);
    } catch (error) {
      logger.error('Python executable not found or not executable', { 
        path: absolutePath 
      });
      throw new Error(`Python executable not found or not executable: ${absolutePath}`);
    }
    
    return absolutePath;
  }

  // Return the validated command name for system PATH lookup
  return basename;
}

/**
 * Validates script path to prevent path traversal attacks
 * 
 * @param {string} scriptPath - Path to script file
 * @param {string} allowedDirectory - Directory where script must be located
 * @returns {Promise<string>} Validated script path
 * @throws {Error} If script path is invalid
 */
async function validateScriptPath(scriptPath, allowedDirectory) {
  if (!scriptPath) {
    throw new Error('Script path is required');
  }

  // Resolve to absolute path
  const absoluteScriptPath = path.resolve(scriptPath);
  const absoluteAllowedDir = path.resolve(allowedDirectory);

  // Check if script is within allowed directory
  if (!absoluteScriptPath.startsWith(absoluteAllowedDir)) {
    logger.error('Script path outside allowed directory', {
      scriptPath: absoluteScriptPath,
      allowedDirectory: absoluteAllowedDir
    });
    throw new Error('Script path outside allowed directory');
  }

  // Check if file exists
  try {
    await fs.promises.access(absoluteScriptPath, fs.constants.R_OK);
  } catch (error) {
    logger.error('Script file not found or not readable', { 
      path: absoluteScriptPath 
    });
    throw new Error(`Script file not found or not readable: ${absoluteScriptPath}`);
  }

  // Validate file extension
  const ext = path.extname(absoluteScriptPath).toLowerCase();
  const allowedExtensions = ['.py', '.js', '.sh'];
  
  if (!allowedExtensions.includes(ext)) {
    logger.error('Invalid script file extension', { 
      path: absoluteScriptPath,
      extension: ext,
      allowed: allowedExtensions 
    });
    throw new Error(`Invalid script extension: ${ext}. Must be one of: ${allowedExtensions.join(', ')}`);
  }

  return absoluteScriptPath;
}

/**
 * Sanitizes command-line arguments to prevent injection
 * 
 * @param {Array<string>} args - Arguments to sanitize
 * @returns {Array<string>} Sanitized arguments
 */
function sanitizeCommandArgs(args) {
  if (!Array.isArray(args)) {
    return [];
  }

  return args.map(arg => {
    // Convert to string
    let sanitized = String(arg);
    
    // Remove potentially dangerous characters
    // Allow alphanumeric, path separators (both / and \), dots, dashes, underscores, colons (for Windows drive letters)
    sanitized = sanitized.replace(/[^a-zA-Z0-9\/_\-\.:\\]/g, '_');
    
    // Prevent command chaining
    const dangerousPatterns = [
      '&&', '||', ';', '|', '`', '$', '(', ')', '{', '}',
      '>', '<', '\n', '\r', '\0'
    ];
    
    for (const pattern of dangerousPatterns) {
      if (sanitized.includes(pattern)) {
        logger.warn('Dangerous pattern detected in argument', { 
          original: arg,
          pattern 
        });
        sanitized = sanitized.replace(new RegExp(pattern, 'g'), '_');
      }
    }
    
    // Limit length to prevent buffer overflow
    const maxLength = 1000;
    if (sanitized.length > maxLength) {
      logger.warn('Argument truncated due to length', { 
        originalLength: sanitized.length,
        maxLength 
      });
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  });
}

/**
 * Creates a safe execution environment for child processes
 * 
 * @returns {Object} Safe environment variables
 */
function getSafeExecutionEnvironment() {
  // Create a clean environment with only necessary variables
  return {
    PATH: process.env.PATH || '',
    HOME: process.env.HOME || process.env.USERPROFILE || '',
    // Add other necessary environment variables
    PYTHONIOENCODING: 'utf-8',
    LANG: 'en_US.UTF-8',
    // Prevent Python from writing bytecode files
    PYTHONDONTWRITEBYTECODE: '1',
  };
}

module.exports = {
  validatePythonExecutable,
  validateScriptPath,
  sanitizeCommandArgs,
  getSafeExecutionEnvironment
};
