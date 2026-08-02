import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database from Excel Data...')

  // 1. Clear existing data
  await prisma.document.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.partSupplier.deleteMany()
  await prisma.stockItem.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.preventiveMaintenance.deleteMany()
  await prisma.intervention.deleteMany()
  await prisma.machine.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()

  // 2. Roles
  const adminRole = await prisma.role.create({ data: { name: 'ADMIN' } })
  const managerRole = await prisma.role.create({ data: { name: 'MANAGER' } })
  const techRole = await prisma.role.create({ data: { name: 'TECHNICIAN' } })
  const internRole = await prisma.role.create({ data: { name: 'INTERN' } })

  // 3. Users (Authentication setup)
  const passwordHash = await bcrypt.hash('password123', 10)
  
  await prisma.user.create({
    data: {
      email: 'admin@fablab.com',
      firstName: 'Admin',
      lastName: 'System',
      passwordHash,
      roleId: adminRole.id
    }
  })

  await prisma.user.create({
    data: {
      email: 'manager@fablab.com',
      firstName: 'Responsable',
      lastName: 'FabLab',
      passwordHash,
      roleId: managerRole.id
    }
  })

  const techUser = await prisma.user.create({
    data: {
      email: 'tech@fablab.com',
      firstName: 'Technicien',
      lastName: 'Expert',
      passwordHash,
      roleId: techRole.id
    }
  })

  // 4. Load Excel Data
  const dataPath = path.join(__dirname, '../../machines_data.json')
  let excelData: any[] = []
  if (fs.existsSync(dataPath)) {
    excelData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  }

  // Categories Map
  const categoryMap = new Map<string, number>()

  // Skip the first 2 metadata rows
  const actualMachines = excelData.slice(2).filter(row => row['__EMPTY'] && typeof row['__EMPTY'] === 'string' && row['__EMPTY'].startsWith('FL-'))

  for (const row of actualMachines) {
    const reference = row['__EMPTY'] || 'N/A'
    const name = row['__EMPTY_1'] || 'Equipement inconnu'
    const description = row['__EMPTY_2'] || ''
    const categoryName = row['__EMPTY_3'] || 'A identifier'
    const quantity = parseInt(row['__EMPTY_4']) || 1
    let status = row['__EMPTY_5'] || 'AVAILABLE'
    
    // Map status to our enum values loosely
    if (status.toUpperCase().includes('BON')) status = 'AVAILABLE'
    else if (status.toUpperCase().includes('PANNE')) status = 'BROKEN'
    else status = 'AVAILABLE'

    // Create category if it doesn't exist
    if (!categoryMap.has(categoryName)) {
      const cat = await prisma.category.create({ data: { name: categoryName } })
      categoryMap.set(categoryName, cat.id)
    }

    const categoryId = categoryMap.get(categoryName)!

    await prisma.machine.create({
      data: {
        reference,
        name,
        description,
        categoryId,
        quantity,
        status
      }
    })
  }

  console.log(`Seeded ${actualMachines.length} machines from Excel.`)

  console.log('Database seeded successfully with Authentication Profiles and Excel Machines!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
