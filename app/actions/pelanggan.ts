"use server"

import prisma from "@/app/lib/prisma";

// fetch customers for autocomplete and data table
export async function searchPelanggan(query: string = "") {
  try {
    const data = await prisma.pelanggan.findMany({
      where: {
        OR: [
          { nama: { contains: query, mode: "insensitive" } },
          { nik: { contains: query } }
        ]
      },
      take: 5 // limit for dropdown hints
    });
    return data;
  } catch (error) {
    console.error("database error:", error);
    return [];
  }
}
