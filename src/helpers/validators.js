import Joi from 'joi'
import { AUTH_TYPES, ENUM_BUSINESS_DAYS, ENUM_BUSINESS_STATUS, ENUM_MARKETPLACE_STATUS, ENUM_ROLES, ROLES } from '../utils/index.js'

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

export const CREATE_PRODUCT_CATEGORY_VALIDATOR = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        'any.required': 'Name is required.',
        'string.empty': 'Name cannot be empty.',
    }),
    active: Joi.boolean().truthy('true', '1').falsy('false', '0').default(true),
})

export const UPDATE_PRODUCT_CATEGORY_VALIDATOR = Joi.object({
    name: Joi.string().min(2).max(100).optional().messages({
        'string.empty': 'Name cannot be empty.',
    }),
    active: Joi.boolean().truthy('true', '1').falsy('false', '0').optional(),
})

const ADDRESS_VALIDATOR = Joi.object({
    formatted: Joi.string().required().messages({
        'any.required': 'Formatted address is required.',
        'string.empty': 'Formatted address cannot be empty.',
    }),
    country: Joi.string().required().messages({
        'any.required': 'Country is required.',
        'string.empty': 'Country cannot be empty.',
    }),
    state: Joi.string().required().messages({
        'any.required': 'State is required.',
        'string.empty': 'State cannot be empty.',
    }),
    city: Joi.string().required().messages({
        'any.required': 'City is required.',
        'string.empty': 'City cannot be empty.',
    }),
    latitude: Joi.number().required().messages({
        'any.required': 'Latitude is required.',
        'number.base': 'Latitude must be a number.',
    }),
    longitude: Joi.number().required().messages({
        'any.required': 'Longitude is required.',
        'number.base': 'Longitude must be a number.',
    }),
})

const BUSINESS_HOURS_VALIDATOR = Joi.array().items(Joi.object({
    day: Joi.string().valid(...ENUM_BUSINESS_DAYS).required().messages({
        'any.only': `Day must be one of: ${ENUM_BUSINESS_DAYS.join(', ')}`,
        'any.required': 'Day is required.',
        'string.empty': 'Day cannot be empty.',
    }),
    open: Joi.string().allow(null, '').optional(),
    close: Joi.string().allow(null, '').optional(),
    closed: Joi.boolean().truthy('true', '1').falsy('false', '0').optional(),
})).messages({
    'array.base': 'Business hours must be an array.',
})

const jsonField = (schema, invalid_message = 'Please provide a valid value.') => Joi.alternatives().try(
    schema,
    Joi.string().custom((value, helpers) => {
        try {
            const parsed = JSON.parse(value)
            const { error, value: validated } = schema.validate(parsed)
            if (error) return helpers.error('any.invalid')
            return validated
        } catch {
            return helpers.error('any.invalid')
        }
    }).messages({
        'any.invalid': invalid_message,
    })
)

export const CREATE_BUSINESS_VALIDATOR = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        'any.required': 'Business name is required.',
        'string.empty': 'Business name cannot be empty.',
        'string.min': 'Business name must be at least 2 characters long.',
        'string.max': 'Business name cannot exceed 100 characters.',
    }),
    description: Joi.string().min(10).max(1000).required().messages({
        'any.required': 'Description is required.',
        'string.empty': 'Description cannot be empty.',
        'string.min': 'Description must be at least 10 characters long.',
        'string.max': 'Description cannot exceed 1000 characters.',
    }),
    category: Joi.string().required().messages({
        'any.required': 'Business category is required.',
        'string.empty': 'Business category cannot be empty.',
    }),
    email: Joi.string().email().optional().allow('').messages({
        'string.email': 'Please enter a valid email.',
    }),
    phone: Joi.string().required().messages({
        'any.required': 'Phone number is required.',
        'string.empty': 'Phone number cannot be empty.',
    }),
    country_code: Joi.string().required().messages({
        'any.required': 'Country code is required.',
        'string.empty': 'Country code cannot be empty.',
    }),
    dialing_code: Joi.string().required().messages({
        'any.required': 'Dialing code is required.',
        'string.empty': 'Dialing code cannot be empty.',
    }),
    website: Joi.string().uri().optional().allow('').messages({
        'string.uri': 'Please enter a valid website URL.',
    }),
    address: jsonField(ADDRESS_VALIDATOR.required(), 'Please provide a valid address.').required().messages({
        'any.required': 'Address is required.',
        'any.invalid': 'Please provide a valid address.',
    }),
    hours: jsonField(BUSINESS_HOURS_VALIDATOR, 'Please provide valid business hours.').optional().messages({
        'any.invalid': 'Please provide valid business hours.',
    }),
})

export const UPDATE_BUSINESS_VALIDATOR = Joi.object({
    name: Joi.string().min(2).max(100).optional().messages({
        'string.empty': 'Business name cannot be empty.',
        'string.min': 'Business name must be at least 2 characters long.',
        'string.max': 'Business name cannot exceed 100 characters.',
    }),
    description: Joi.string().min(10).max(1000).optional().messages({
        'string.empty': 'Description cannot be empty.',
        'string.min': 'Description must be at least 10 characters long.',
        'string.max': 'Description cannot exceed 1000 characters.',
    }),
    category: Joi.string().optional().messages({
        'string.empty': 'Business category cannot be empty.',
    }),
    email: Joi.string().email().optional().allow('').messages({
        'string.email': 'Please enter a valid email.',
    }),
    phone: Joi.string().optional().messages({
        'string.empty': 'Phone number cannot be empty.',
    }),
    country_code: Joi.string().optional().messages({
        'string.empty': 'Country code cannot be empty.',
    }),
    dialing_code: Joi.string().optional().messages({
        'string.empty': 'Dialing code cannot be empty.',
    }),
    website: Joi.string().uri().optional().allow('').messages({
        'string.uri': 'Please enter a valid website URL.',
    }),
    address: jsonField(ADDRESS_VALIDATOR, 'Please provide a valid address.').optional().messages({
        'any.invalid': 'Please provide a valid address.',
    }),
    hours: jsonField(BUSINESS_HOURS_VALIDATOR, 'Please provide valid business hours.').optional().messages({
        'any.invalid': 'Please provide valid business hours.',
    }),
    status: Joi.string().valid(...ENUM_BUSINESS_STATUS).optional().messages({
        'any.only': `Status must be one of: ${ENUM_BUSINESS_STATUS.join(', ')}`,
    }),
    verified: Joi.boolean().truthy('true', '1').falsy('false', '0').optional(),
    featured: Joi.boolean().truthy('true', '1').falsy('false', '0').optional(),
    active: Joi.boolean().truthy('true', '1').falsy('false', '0').optional(),
    rejection_reason: Joi.string().allow(null, '').optional(),
})

export const CREATE_MARKETPLACE_VALIDATOR = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        'any.required': 'Listing name is required.',
        'string.empty': 'Listing name cannot be empty.',
        'string.min': 'Listing name must be at least 2 characters long.',
        'string.max': 'Listing name cannot exceed 100 characters.',
    }),
    description: Joi.string().min(10).max(1000).required().messages({
        'any.required': 'Description is required.',
        'string.empty': 'Description cannot be empty.',
        'string.min': 'Description must be at least 10 characters long.',
        'string.max': 'Description cannot exceed 1000 characters.',
    }),
    category: Joi.string().required().messages({
        'any.required': 'Product category is required.',
        'string.empty': 'Product category cannot be empty.',
    }),
    price: Joi.number().min(0).required().messages({
        'any.required': 'Price is required.',
        'number.base': 'Price must be a number.',
        'number.min': 'Price cannot be negative.',
    }),
})

export const UPDATE_MARKETPLACE_VALIDATOR = Joi.object({
    name: Joi.string().min(2).max(100).optional().messages({
        'string.empty': 'Listing name cannot be empty.',
        'string.min': 'Listing name must be at least 2 characters long.',
        'string.max': 'Listing name cannot exceed 100 characters.',
    }),
    description: Joi.string().min(10).max(1000).optional().messages({
        'string.empty': 'Description cannot be empty.',
        'string.min': 'Description must be at least 10 characters long.',
        'string.max': 'Description cannot exceed 1000 characters.',
    }),
    category: Joi.string().optional().messages({
        'string.empty': 'Product category cannot be empty.',
    }),
    price: Joi.number().min(0).optional().messages({
        'number.base': 'Price must be a number.',
        'number.min': 'Price cannot be negative.',
    }),
    status: Joi.string().valid(...ENUM_MARKETPLACE_STATUS).optional().messages({
        'any.only': `Status must be one of: ${ENUM_MARKETPLACE_STATUS.join(', ')}`,
    }),
    active: Joi.boolean().truthy('true', '1').falsy('false', '0').optional(),
})
