import prisma from '@/app/lib/prisma';
import KaryawanClient from './KaryawanClient';

// dummy current user id, should be retrieved from real auth session
const currentUserMock = { id: 'dummy-admin-id' };

export default async function KaryawanPage() {
  // get all users without relations
  const karyawanList = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Data Karyawan</h1>
      </div>

      <KaryawanClient initialData={karyawanList} currentUser={currentUserMock} />
    </div>
  );
}
