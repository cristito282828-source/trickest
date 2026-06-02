import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ──────────────────────────────────────────────────────────────
  // 1. ADMIN USER — Jonathan Vargas
  // ──────────────────────────────────────────────────────────────
  const defaultPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'jonathanfelipe0111@hotmail.com' },
    update: {
      role: 'admin',
      profileStatus: 'complete',
    },
    create: {
      email: 'jonathanfelipe0111@hotmail.com',
      username: 'jonathanvargas',
      name: 'Jonathan Vargas',
      password: defaultPassword,
      role: 'admin',
      profileStatus: 'complete',
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Segundo admin — dev colaborador. Email placeholder, lo cambia él al primer login.
  const devAdmin = await prisma.user.upsert({
    where: { email: 'cristiansk8@trickest.dev' },
    update: {
      role: 'admin',
      profileStatus: 'complete',
    },
    create: {
      email: 'cristiansk8@trickest.dev',
      username: 'cristiansk8',
      name: 'Cristian',
      password: defaultPassword,
      role: 'admin',
      profileStatus: 'complete',
    },
  });
  console.log(`✅ Admin: ${devAdmin.email}`);

  // ──────────────────────────────────────────────────────────────
  // 2. CHALLENGES — 10 niveles + bonus
  // ──────────────────────────────────────────────────────────────
  const challenges = [
    { level: 1, name: 'Ollie', description: 'El truco fundamental del skateboarding. Salta con tu tabla sin usar las manos.', demoVideoUrl: 'https://www.youtube.com/watch?v=QkeOAcj8Y5k', difficulty: 'easy', points: 100, isBonus: false },
    { level: 2, name: 'Kickflip', description: 'Haz que la tabla gire 360° sobre su eje longitudinal mientras estás en el aire.', demoVideoUrl: 'https://www.youtube.com/watch?v=ZOtJdT9p-n8', difficulty: 'medium', points: 150, isBonus: false },
    { level: 3, name: 'Heelflip', description: 'Similar al kickflip pero la tabla gira en dirección opuesta usando el talón.', demoVideoUrl: 'https://www.youtube.com/watch?v=VBhWU4OvkdA', difficulty: 'medium', points: 150, isBonus: false },
    { level: 4, name: '50-50 Grind', description: 'Deslízate sobre un rail o borde con ambos trucks simultáneamente.', demoVideoUrl: 'https://www.youtube.com/watch?v=7qrT38TnH5A', difficulty: 'medium', points: 200, isBonus: false },
    { level: 5, name: 'Boardslide', description: 'Deslízate sobre un obstáculo con el centro de la tabla perpendicular al rail.', demoVideoUrl: 'https://www.youtube.com/watch?v=ioODobuRguU', difficulty: 'medium', points: 200, isBonus: false },
    { level: 6, name: 'Pop Shove-it', description: 'La tabla gira 180° horizontalmente mientras saltas.', demoVideoUrl: 'https://www.youtube.com/watch?v=y8p_vFJWa_8', difficulty: 'medium', points: 180, isBonus: false },
    { level: 7, name: '360 Flip (Tre Flip)', description: 'Combina un kickflip con un 360 shove-it. La tabla gira en dos ejes.', demoVideoUrl: 'https://www.youtube.com/watch?v=aHrn3-Cb3iM', difficulty: 'hard', points: 300, isBonus: false },
    { level: 8, name: 'Hardflip', description: 'Combinación de frontside shove-it y kickflip. Truco técnico avanzado.', demoVideoUrl: 'https://www.youtube.com/watch?v=QXbWCrzWJo8', difficulty: 'hard', points: 350, isBonus: false },
    { level: 9, name: 'Nollie Heelflip', description: 'Heelflip ejecutado desde nollie (pop con la nariz de la tabla).', demoVideoUrl: 'https://www.youtube.com/watch?v=7Jxb0M8qXHw', difficulty: 'hard', points: 400, isBonus: false },
    { level: 10, name: 'Switch Kickflip', description: 'Kickflip en stance opuesto a tu postura natural. Requiere dominio total.', demoVideoUrl: 'https://www.youtube.com/watch?v=CTeXKHkNqgk', difficulty: 'expert', points: 500, isBonus: false },
    { level: 0, name: 'BONUS: Impossible', description: '¡NIVEL BONUS! La tabla da una vuelta vertical completa alrededor de tu pie trasero.', demoVideoUrl: 'https://www.youtube.com/watch?v=dWfn7sToTkE', difficulty: 'expert', points: 1000, isBonus: true },
  ];

  for (const c of challenges) {
    await prisma.challenge.upsert({
      where: { level_isBonus: { level: c.level, isBonus: c.isBonus } },
      update: c,
      create: c,
    });
  }
  console.log(`✅ Challenges: ${challenges.length} (10 levels + 1 bonus)`);

  // ──────────────────────────────────────────────────────────────
  // 3. APP SETTINGS
  // ──────────────────────────────────────────────────────────────
  const settings = [
    { key: 'total_levels', value: '10', description: 'Total de niveles activos (excluye bonus). Usado en HomeLevelSection y admin/settings.' },
  ];

  for (const s of settings) {
    await prisma.appSettings.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description, updatedBy: admin.email },
      create: { ...s, updatedBy: admin.email },
    });
  }
  console.log(`✅ AppSettings: ${settings.length} key(s)`);

  console.log('\n🎉 Seed completed');
  console.log('────────────────────────────────');
  console.log(`Admin login:  ${admin.email}`);
  console.log(`Password:     password123  (cambialo después de loguearte)`);
  console.log('────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
