import { createHash } from 'node:crypto'

export class CSVParserService {
  static parseFrenchNumber(value: string): number {
    if (!value?.trim()) return 0
    return parseFloat(value.replace(/\s/g, '').replace(',', '.'))
  }

  static parseFrenchDate(value: string): string | null {
    if (!value?.trim()) return null
    const [day, month, year] = value.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  static parseCsvContent(content: string): Record<string, string>[] {
    const lines = content.trim().split('\n')
    const headers = lines[0].split(';').map((h) => h.trim())

    return lines.slice(1).map((line) => {
      const values = line.split(';').map((v) => v.trim())
      return Object.fromEntries(headers.map((h, i) => [h, values[i]]))
    })
  }

  static toTransactionValues(rows: Record<string, string>[]) {
    const occurrences = new Map<string, number>()

    return rows.map((row) => {
      const debit = CSVParserService.parseFrenchNumber(row['Debit'])
      const credit = CSVParserService.parseFrenchNumber(row['Credit'])
      const pointage = (row['Pointage operation'] ?? '').trim().toLowerCase()

      const transaction = {
        accountingDate: CSVParserService.parseFrenchDate(row['Date de comptabilisation'])!,
        operationDate: CSVParserService.parseFrenchDate(row['Date operation']),
        valueDate: CSVParserService.parseFrenchDate(row['Date de valeur']),
        shortLabel: row['Libelle simplifie'],
        fullLabel: row['Libelle operation'] || null,
        reference: row['Reference'] || null,
        additionalInfo: row['Informations complementaires'] || null,
        operationType: row['Type operation'] || null,
        category: row['Categorie'] || null,
        subcategory: row['Sous categorie'] || null,
        // La colonne Debit de l'export est déjà signée : on force le signe pour
        // rester correct quel que soit le format.
        amount: debit !== 0 ? -Math.abs(debit) : credit,
        reconciled: pointage === '1' || pointage === 'oui' || pointage.includes('point')
      }

      const identity = [
        transaction.accountingDate,
        transaction.operationDate,
        transaction.valueDate,
        transaction.shortLabel,
        transaction.fullLabel,
        transaction.reference,
        transaction.additionalInfo,
        transaction.operationType,
        transaction.amount.toFixed(2)
      ]
        .map((part) => part ?? '')
        .join('|')

      // Deux opérations réellement identiques le même jour restent distinctes,
      // et gardent le même rang d'un import à l'autre : pas de doublon.
      const rank = occurrences.get(identity) ?? 0
      occurrences.set(identity, rank + 1)

      return {
        ...transaction,
        fingerprint: createHash('sha1').update(`${identity}|${rank}`).digest('hex')
      }
    })
  }
}
