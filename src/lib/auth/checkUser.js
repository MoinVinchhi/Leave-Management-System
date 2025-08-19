import jwt from 'jsonwebtoken';

export async function checkUser(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return { error: { error: 'Unauthorized: No token provided' }, status: 401 };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return { error: { error: 'Unauthorized: Invalid token' }, status: 401 };
  }

  request.data = decoded;

  return { decoded };
}
