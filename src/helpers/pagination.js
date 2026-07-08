export const getPagination = (query) => {

    const is_paginated = query.page !== undefined || query.page_size !== undefined

    if (!is_paginated) {
        return {
            skip: null,
            limit: null,
            page: null,
            page_size: null
        }
    }

    const page = Math.max(1, parseInt(query.page) || 1)
    const page_size = Math.max(1, parseInt(query.page_size) || 10)
    const skip = (page - 1) * page_size
    const limit = page_size

    return { skip, limit, page, page_size }

}

export const buildPaginationResponse = (data, total, page, page_size) => {
    return {
        data,
        pagination: {
            total,
            page,
            page_size: page_size,
            total_pages: Math.ceil(total / page_size)
        }
    }
}
