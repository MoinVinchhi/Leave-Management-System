export const GetDBSettings = () => {
  return {
    host: process.env.host_dev, //'58.84.143.251',
    port: parseInt(process.env.port_dev),
    user: process.env.user_dev,
    password: process.env.password_dev,
    database: process.env.database_dev,
  };
};
