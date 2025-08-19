import validator from 'validator';

export function validateUser(data) {
  const mandatoryFields = ['first_name', 'last_name', 'email', 'join_date', 'department', 'role'];
  const isAllowed = mandatoryFields.every((k) => Object.keys(data).includes(k));

  if (!isAllowed) 
    throw new Error('Mandatory Field(s) Missing');

  if (!validator.isEmail(data.email))
    throw new Error('Invalid Email');

  if (data?.password?.length < 4)
    throw new Error('Weak Password (minimum length should be 4)');

  if (data?.first_name?.length < 2 || data?.first_name?.length > 10) 
    throw new Error("Firstname's Length Is Invalid");

  if (data?.last_name?.length < 2 || data?.last_name?.length > 10) 
    throw new Error("Lastname's Length Is Invalid");
}
