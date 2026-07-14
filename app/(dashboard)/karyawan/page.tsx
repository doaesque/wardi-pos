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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Data Karyawan</h1>
        </div>
      </div>

      <KaryawanClient initialData={karyawanList} currentUser={currentUserMock} />
    </div>
  );
}
