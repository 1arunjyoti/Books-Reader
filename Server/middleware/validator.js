const { ZodError } = require('zod');
const logger = require('../utils/logger');

/**
 * Validation Middleware using Zod
 * Creates middleware that validates request data against Zod schemas
 */

/**
 * Validation target types
 */
const ValidationTarget = {
  BODY: 'body',
  PARAMS: 'params',
  QUERY: 'query',
};

/**
 * Create validation middleware for a specific schema and target
 * 
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {string} target - Where to validate (body, params, query)
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.post('/', validate(createBookSchema, 'body'), controller.create);
 * router.get('/:id', validate(idParamSchema, 'params'), controller.getById);
 */
function validate(schema, target = ValidationTarget.BODY) {
  return async (req, res, next) => {
    try {
      // Get the data to validate based on target
      const dataToValidate = req[target];
      
      // Validate and transform data
      const validated = await schema.parseAsync(dataToValidate);
      
      // Replace original data with validated/transformed data
      req[target] = validated;
      
      // Log validation success in development
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Validation passed', {
          target,
          path: req.path,
          method: req.method,
        });
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly messages
        const formattedErrors = formatZodErrors(error);
        
        // Log validation failure
        logger.warn('Validation failed', {
          target,
          path: req.path,
          method: req.method,
          errors: formattedErrors,
          userId: req.auth?.sub,
          ip: req.ip,
        });
        
        // Return 400 Bad Request with detailed errors
        return res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors,
        });
      }
      
      // Unexpected error during validation
      logger.error('Validation middleware error', {
        error: error.message,
        stack: error.stack,
        target,
        path: req.path,
      });
      
      return res.status(500).json({
        error: 'Internal validation error',
      });
    }
  };
}

/**
 * Format Zod errors into user-friendly structure
 * 
 * @param {ZodError} zodError - Zod validation error
 * @returns {Array} Array of formatted error objects
 */
function formatZodErrors(zodError) {
  // Ensure errors array exists
  if (!zodError || !zodError.errors || !Array.isArray(zodError.errors)) {
    return [{
      field: 'unknown',
      message: zodError?.message || 'Validation error occurred',
      code: 'unknown'
    }];
  }
  
  return zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    // Include expected type for type errors
    ...(err.expected && { expected: err.expected }),
    // Include received value for debugging (careful not to leak sensitive data)
    ...(err.received && !isSensitiveField(err.path) && { received: err.received }),
  }));
}

/**
 * Check if a field path contains sensitive data
 * 
 * @param {Array} path - Field path array
 * @returns {boolean} True if field is sensitive
 */
function isSensitiveField(path) {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'auth',
  ];
  
  return path.some(segment => 
    sensitiveFields.some(sensitive => 
      segment.toLowerCase().includes(sensitive)
    )
  );
}

/**
 * Convenience middleware creators for common validation targets
 */
const validateBody = (schema) => validate(schema, ValidationTarget.BODY);
const validateParams = (schema) => validate(schema, ValidationTarget.PARAMS);
const validateQuery = (schema) => validate(schema, ValidationTarget.QUERY);

/**
 * Combine multiple validators (for multiple targets)
 * 
 * @param {Array<Function>} validators - Array of validation middlewares
 * @returns {Array<Function>} Array of middleware functions
 * 
 * @example
 * router.get('/:id',
 *   ...validateAll([
 *     validateParams(idParamSchema),
 *     validateQuery(paginationSchema)
 *   ]),
 *   controller.getById
 * );
 */
function validateAll(validators) {
  return validators;
}

module.exports = {
  validate,
  validateBody,
  validateParams,
  validateQuery,
  validateAll,
  ValidationTarget,
};
