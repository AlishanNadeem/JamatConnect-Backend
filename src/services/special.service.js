export const isSpecialOwner = (special_business_user_id, user_id) => {
    return String(special_business_user_id) === String(user_id)
}
