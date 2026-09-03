export const isJobOwner = (job, user_id) => job.business?.user?.toString() === user_id
