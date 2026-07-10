import Joi from 'joi'
import { AUTH_TYPES, ENUM_ROLES, ROLES } from '../utils/index.js'

export const SIGNUP_VALIDATOR = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
        'string.empty': 'Name is required',
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email',
        'string.empty': 'Email is required',
    }),
    password: Joi.when('auth_provider', {
        is: AUTH_TYPES.EMAIL,
        then: Joi.string().min(6).required().messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 6 characters long',
        }),
        otherwise: Joi.string().optional(),
    }),
    auth_provider: Joi.string().valid(...Object.values(AUTH_TYPES)).default(AUTH_TYPES.EMAIL),
    provider_id: Joi.when('auth_provider', {
        is: Joi.not(AUTH_TYPES.EMAIL),
        then: Joi.string().required().messages({
            'string.empty': 'Provider id is required for social signup',
        }),
        otherwise: Joi.optional(),
    }),
    referral_code: Joi.string().trim().required().messages({
        'string.empty': 'Referral code is required',
        'any.required': 'Referral code is required',
    }),
})

export const LOGIN_VALIDATOR = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email',
        'string.empty': 'Email is required',
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required',
    }),
    source: Joi.string()
        .valid(...ENUM_ROLES)
        .default(ROLES.USER)
        .messages({
            'any.only': `Source must be one of: ${ENUM_ROLES.join(', ')}`,
        }),
    device_id: Joi.string().optional().messages({
        'string.base': 'Device ID must be a string',
    }),
})

export const SOCIAL_LOGIN_VALIDATOR = Joi.object({
    access_token: Joi.string().required().messages({
        'string.empty': 'Access token is required',
        'any.required': 'Access token is required',
    }),
    type: Joi.string()
        .valid(...Object.values(AUTH_TYPES))
        .required()
        .messages({
            'any.only': `Type must be one of: ${Object.values(AUTH_TYPES).join(', ')}`,
            'string.empty': 'Type is required',
            'any.required': 'Type is required',
        }),
    source: Joi.string()
        .valid(...ENUM_ROLES)
        .default(ROLES.USER)
        .messages({
            'any.only': `Source must be one of: ${ENUM_ROLES.join(', ')}`,
        }),
    device_id: Joi.string().optional().messages({
        'string.base': 'Device ID must be a string',
    }),
})

export const FORGET_PASSWORD_VALIDATOR = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email',
        'string.empty': 'Email is required',
    })
})

export const VERIFY_OTP_VALIDATOR = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email',
        'string.empty': 'Email is required',
    }),
    otp: Joi.string().length(6).required(),
})

export const SET_PASSWORD_VALIDATOR = Joi.object({
    password: Joi.string().min(6).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long',
    })
})

export const LOGOUT_VALIDATOR = Joi.object({
    device_id: Joi.string().optional().messages({
        'string.base': 'Device ID must be a string'
    })
})

export const COMPLETE_PROFILE_VALIDATOR = Joi.object({
    date_of_birth: Joi.date().allow(null).optional().messages({
        'date.base': 'Please enter a valid date of birth',
    }),
    country_code: Joi.string().required().messages({
        'string.base': 'Please enter a valid country code',
        'string.empty': 'Country code is required',
        'any.required': 'Country code is required',
    }),
    dialing_code: Joi.string().required().messages({
        'string.base': 'Please enter a valid dialing code',
        'string.empty': 'Dialing code is required',
        'any.required': 'Dialing code is required',
    }),
    phone: Joi.string().required().messages({
        'string.base': 'Please enter a valid phone number',
        'string.empty': 'Phone number is required',
        'any.required': 'Phone number is required',
    }),
    emergency_notes: Joi.string().optional().allow("").messages({
        'string.base': 'Please enter valid emergency notes',
    }),
})

export const CHANGE_PASSWORD_VALIDATOR = Joi.object({
    old_password: Joi.string().min(6).required().messages({
        "any.required": "Old password is required."
    }),
    new_password: Joi.string().min(6).required().messages({
        'string.empty': 'New password is required',
        'string.min': 'Password must be at least 6 characters long',
    })
})

export const UPDATE_PROFILE_VALIDATOR = Joi.object({
    name: Joi.string().min(2).max(50).optional().messages({
        'string.empty': 'Name cannot be empty.',
        'string.min': 'Name must be at least 2 characters long.',
        'string.max': 'Name cannot exceed 50 characters.'
    }),
    country_code: Joi.string().optional().messages({
        'string.empty': 'Country code cannot be empty.'
    }),
    dialing_code: Joi.string().optional().messages({
        'string.empty': 'Dialing code cannot be empty.'
    }),
    phone: Joi.string().optional().messages({
        'string.empty': 'Phone number cannot be empty.'
    }),
    emergency_notes: Joi.string().optional().allow("").messages({
        'string.base': 'Please enter valid emergency notes',
    }),
    date_of_birth: Joi.date().allow(null).optional().messages({
        'date.base': 'Please enter a valid date of birth',
    }),
})

export const CREATE_FEEDBACK_VALIDATOR = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
        'any.required': 'Name is required.',
        'string.empty': 'Name cannot be empty.'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email',
        'any.required': 'Email is required.'
    }),
    subject: Joi.string().min(3).max(150).required().messages({
        'any.required': 'Subject is required.',
        'string.empty': 'Subject cannot be empty.'
    }),
    message: Joi.string().min(5).max(1000).required().messages({
        'any.required': 'Message is required.',
        'string.empty': 'Message cannot be empty.'
    })
})

export const CREATE_BUSINESS_CATEGORY_VALIDATOR = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        'any.required': 'Name is required.',
        'string.empty': 'Name cannot be empty.',
    }),
    description: Joi.string().max(500).optional().allow('').messages({
        'string.max': 'Description cannot exceed 500 characters.',
    }),
    active: Joi.boolean().truthy('true', '1').falsy('false', '0').default(true),
})

export const UPDATE_BUSINESS_CATEGORY_VALIDATOR = Joi.object({
    name: Joi.string().min(2).max(100).optional().messages({
        'string.empty': 'Name cannot be empty.',
    }),
    description: Joi.string().max(500).optional().allow('').messages({
        'string.max': 'Description cannot exceed 500 characters.',
    }),
    active: Joi.boolean().truthy('true', '1').falsy('false', '0').optional(),
})
