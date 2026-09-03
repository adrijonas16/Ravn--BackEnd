import { createApp } from './create-app';

// bootstrap(): función principal que arranca toda la aplicación
async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
