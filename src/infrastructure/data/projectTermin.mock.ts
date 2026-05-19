import type { TerminInstallment } from "@/domain/entities/ProjectTermin";

// Modeled after the FS PRO "Termin Project Monitoring" sheet — each row is a
// single installment within a project's billing scheme.
export const mockProjectTermin: TerminInstallment[] = [
  // PRJ-24/UBS/CHMNYMNTRNG-0089 — Chimney Monitoring UBS
  { id: "tm-001", projectCode: "PRJ-24/UBS/CHMNYMNTRNG-0089", projectName: "Chimney Monitoring UBS", clientName: "UBS GOLD", totalProjectValue: 172_979_040, termOfPayment: "2x (70-30)", installmentNo: 1, installmentType: "DP", percentage: 70, amountDue: 121_085_328, terminDueDate: "2025-01-10", paidAt: "2025-01-12", status: "Paid" },
  { id: "tm-002", projectCode: "PRJ-24/UBS/CHMNYMNTRNG-0089", projectName: "Chimney Monitoring UBS", clientName: "UBS GOLD", totalProjectValue: 172_979_040, termOfPayment: "2x (70-30)", installmentNo: 2, installmentType: "Final", percentage: 30, amountDue: 51_893_712, terminDueDate: "2026-02-17", status: "Upcoming" },

  // PRJ-25/UBS/SSTMASSMNTUBS-0016 — Pengembangan Sistem Assessment Platform UBS
  { id: "tm-003", projectCode: "PRJ-25/UBS/SSTMASSMNTUBS-0016", projectName: "Pengembangan Sistem Assessment Platform UBS", clientName: "UBS GOLD", totalProjectValue: 550_000_000, termOfPayment: "3x (50-30-20)", installmentNo: 1, installmentType: "DP", percentage: 50, amountDue: 275_000_000, terminDueDate: "2025-03-14", paidAt: "2025-03-18", status: "Paid" },
  { id: "tm-004", projectCode: "PRJ-25/UBS/SSTMASSMNTUBS-0016", projectName: "Pengembangan Sistem Assessment Platform UBS", clientName: "UBS GOLD", totalProjectValue: 550_000_000, termOfPayment: "3x (50-30-20)", installmentNo: 2, installmentType: "UAT", percentage: 30, amountDue: 165_000_000, terminDueDate: "2025-08-26", paidAt: "2025-09-02", status: "Paid" },
  { id: "tm-005", projectCode: "PRJ-25/UBS/SSTMASSMNTUBS-0016", projectName: "Pengembangan Sistem Assessment Platform UBS", clientName: "UBS GOLD", totalProjectValue: 550_000_000, termOfPayment: "3x (50-30-20)", installmentNo: 3, installmentType: "BAST", percentage: 20, amountDue: 110_000_000, progressDueDate: "2026-06-30", status: "Pending" },

  // PRJ-25/UBS/RCRTMNTDDNMDL-0075 — Recruitment Add-on Module UBS
  { id: "tm-006", projectCode: "PRJ-25/UBS/RCRTMNTDDNMDL-0075", projectName: "Recruitment Add-on Module UBS", clientName: "UBS GOLD", totalProjectValue: 176_000_000, termOfPayment: "2x (50-50)", installmentNo: 1, installmentType: "DP", percentage: 50, amountDue: 88_000_000, terminDueDate: "2025-09-30", paidAt: "2025-10-03", status: "Paid" },
  { id: "tm-007", projectCode: "PRJ-25/UBS/RCRTMNTDDNMDL-0075", projectName: "Recruitment Add-on Module UBS", clientName: "UBS GOLD", totalProjectValue: 176_000_000, termOfPayment: "2x (50-50)", installmentNo: 2, installmentType: "BAST", percentage: 50, amountDue: 88_000_000, progressDueDate: "2025-12-12", terminDueDate: "2026-01-10", status: "Invoiced" },

  // PRJ-25/UBS/LMPPS-0030 — Development LM Apps UBS
  { id: "tm-008", projectCode: "PRJ-25/UBS/LMPPS-0030", projectName: "Development LM Apps UBS", clientName: "UBS GOLD", totalProjectValue: 850_000_000, termOfPayment: "2x (70-30)", installmentNo: 1, installmentType: "DP", percentage: 70, amountDue: 595_000_000, terminDueDate: "2025-06-07", paidAt: "2025-06-10", status: "Paid" },
  { id: "tm-009", projectCode: "PRJ-25/UBS/LMPPS-0030", projectName: "Development LM Apps UBS", clientName: "UBS GOLD", totalProjectValue: 850_000_000, termOfPayment: "2x (70-30)", installmentNo: 2, installmentType: "Final", percentage: 30, amountDue: 255_000_000, progressDueDate: "2026-08-30", status: "Pending" },

  // PRJ-25/BENING/CSMSPCDVLPMNT-0100 — CSMS POC Development Bening
  { id: "tm-010", projectCode: "PRJ-25/BENING/CSMSPCDVLPMNT-0100", projectName: "CSMS POC Development Bening", clientName: "BENING GROUP", totalProjectValue: 39_500_000, termOfPayment: "1x (100)", installmentNo: 1, installmentType: "Final", percentage: 100, amountDue: 39_500_000, terminDueDate: "2025-12-12", paidAt: "2025-12-15", status: "Paid" },

  // PRJ-25/BENING/CSMSNHNCMNTSMLTR-0104 — CSMS Enhancement & Simulator Development Bening
  { id: "tm-011", projectCode: "PRJ-25/BENING/CSMSNHNCMNTSMLTR-0104", projectName: "CSMS Enhancement & Simulator Development Bening", clientName: "BENING GROUP", totalProjectValue: 97_500_000, termOfPayment: "1x (100)", installmentNo: 1, installmentType: "Final", percentage: 100, amountDue: 97_500_000, terminDueDate: "2025-12-31", paidAt: "2026-01-05", status: "Paid" },

  // PRJ-25/BENING/DDTNLTMCSMS-0125 — Additional Team for CSMS Bening
  { id: "tm-012", projectCode: "PRJ-25/BENING/DDTNLTMCSMS-0125", projectName: "Additional Team for CSMS Bening", clientName: "BENING GROUP", totalProjectValue: 11_250_000, termOfPayment: "1x (100)", installmentNo: 1, installmentType: "Final", percentage: 100, amountDue: 11_250_000, terminDueDate: "2026-01-10", status: "Due" },

  // PRJ-25/BENING/DGTLTWNDVLPMNT-0103 — Digital Twin Development Bening
  { id: "tm-013", projectCode: "PRJ-25/BENING/DGTLTWNDVLPMNT-0103", projectName: "Digital Twin Development Bening", clientName: "BENING GROUP", totalProjectValue: 474_000_000, termOfPayment: "5x (20-25-25-25-5)", installmentNo: 1, installmentType: "Pekerjaan 25%", percentage: 20, amountDue: 94_800_000, terminDueDate: "2026-01-10", paidAt: "2026-01-14", status: "Paid" },
  { id: "tm-014", projectCode: "PRJ-25/BENING/DGTLTWNDVLPMNT-0103", projectName: "Digital Twin Development Bening", clientName: "BENING GROUP", totalProjectValue: 474_000_000, termOfPayment: "5x (20-25-25-25-5)", installmentNo: 2, installmentType: "Pekerjaan 50%", percentage: 25, amountDue: 118_500_000, terminDueDate: "2026-03-09", paidAt: "2026-03-14", status: "Paid" },
  { id: "tm-015", projectCode: "PRJ-25/BENING/DGTLTWNDVLPMNT-0103", projectName: "Digital Twin Development Bening", clientName: "BENING GROUP", totalProjectValue: 474_000_000, termOfPayment: "5x (20-25-25-25-5)", installmentNo: 3, installmentType: "Pekerjaan 75%", percentage: 25, amountDue: 118_500_000, terminDueDate: "2026-03-09", status: "Invoiced" },
  { id: "tm-016", projectCode: "PRJ-25/BENING/DGTLTWNDVLPMNT-0103", projectName: "Digital Twin Development Bening", clientName: "BENING GROUP", totalProjectValue: 474_000_000, termOfPayment: "5x (20-25-25-25-5)", installmentNo: 4, installmentType: "Pekerjaan 100%/Go live", percentage: 25, amountDue: 118_500_000, terminDueDate: "2026-06-07", status: "Upcoming" },
  { id: "tm-017", projectCode: "PRJ-25/BENING/DGTLTWNDVLPMNT-0103", projectName: "Digital Twin Development Bening", clientName: "BENING GROUP", totalProjectValue: 474_000_000, termOfPayment: "5x (20-25-25-25-5)", installmentNo: 5, installmentType: "2 Bulan setelah Go live", percentage: 5, amountDue: 23_700_000, status: "Pending" },

  // PRJ-25/LPS/PPVRMDLBDR-0099 — Aplikasi Virtual Reality Modul Bank Dalam Resolusi (BDR) LPS
  { id: "tm-018", projectCode: "PRJ-25/LPS/PPVRMDLBDR-0099", projectName: "Aplikasi Virtual Reality Modul Bank Dalam Resolusi (BDR) LPS", clientName: "Lembaga Penjamin Simpanan", totalProjectValue: 516_438_750, termOfPayment: "2x (30-70)", installmentNo: 1, installmentType: "Penyerahan Rencana Kerja", percentage: 30, amountDue: 154_931_625, terminDueDate: "2025-11-25", paidAt: "2025-12-01", status: "Paid" },
  { id: "tm-019", projectCode: "PRJ-25/LPS/PPVRMDLBDR-0099", projectName: "Aplikasi Virtual Reality Modul Bank Dalam Resolusi (BDR) LPS", clientName: "Lembaga Penjamin Simpanan", totalProjectValue: 516_438_750, termOfPayment: "2x (30-70)", installmentNo: 2, installmentType: "Final", percentage: 70, amountDue: 361_507_125, terminDueDate: "2026-01-14", status: "Overdue" },

  // PRJ-25/BENING/HRDWRTLGT-0076 — Hardware Tailgate Bening Guru Semesta
  { id: "tm-020", projectCode: "PRJ-25/BENING/HRDWRTLGT-0076", projectName: "Hardware Tailgate Bening Guru Semesta", clientName: "BENING GROUP", totalProjectValue: 126_500_000, termOfPayment: "2x (HW - SW)", installmentNo: 1, installmentType: "Procurement Hardware", percentage: 40, amountDue: 50_000_000, terminDueDate: "2025-10-09", paidAt: "2025-10-14", status: "Paid" },
  { id: "tm-021", projectCode: "PRJ-25/BENING/HRDWRTLGT-0076", projectName: "Hardware Tailgate Bening Guru Semesta", clientName: "BENING GROUP", totalProjectValue: 126_500_000, termOfPayment: "2x (HW - SW)", installmentNo: 2, installmentType: "Manpower Services", percentage: 60, amountDue: 76_500_000, terminDueDate: "2026-04-15", status: "Upcoming" },

  // PRJ-25/BENING/HRDWRVCHRG-0060 — Procurement Hardware EV Charging
  { id: "tm-022", projectCode: "PRJ-25/BENING/HRDWRVCHRG-0060", projectName: "Procurement Hardware EV Charging", clientName: "BENING GROUP", totalProjectValue: 121_036_036, termOfPayment: "2x (HW - SW)", installmentNo: 1, installmentType: "Procurement Hardware", percentage: 26, amountDue: 31_036_036, terminDueDate: "2025-09-11", paidAt: "2025-09-15", status: "Paid" },
  { id: "tm-023", projectCode: "PRJ-25/BENING/HRDWRVCHRG-0060", projectName: "Procurement Hardware EV Charging", clientName: "BENING GROUP", totalProjectValue: 121_036_036, termOfPayment: "2x (HW - SW)", installmentNo: 2, installmentType: "Manpower Services", percentage: 74, amountDue: 90_000_000, terminDueDate: "2026-02-15", status: "Invoiced" },

  // PRJ-25/UBS/NLYRPRMNTMTN-0028
  { id: "tm-024", projectCode: "PRJ-25/UBS/NLYRPRMNTMTN-0028", projectName: "Analyse & Repairment MTN Module Scada", clientName: "UBS GOLD", totalProjectValue: 70_000_000, termOfPayment: "4x (40-30-20-10)", installmentNo: 1, installmentType: "DP", percentage: 40, amountDue: 28_000_000, terminDueDate: "2025-11-04", paidAt: "2025-11-08", status: "Paid" },
  { id: "tm-025", projectCode: "PRJ-25/UBS/NLYRPRMNTMTN-0028", projectName: "Analyse & Repairment MTN Module Scada", clientName: "UBS GOLD", totalProjectValue: 70_000_000, termOfPayment: "4x (40-30-20-10)", installmentNo: 2, installmentType: "Pekerjaan 50%", percentage: 30, amountDue: 21_000_000, terminDueDate: "2026-02-04", status: "Due" },
  { id: "tm-026", projectCode: "PRJ-25/UBS/NLYRPRMNTMTN-0028", projectName: "Analyse & Repairment MTN Module Scada", clientName: "UBS GOLD", totalProjectValue: 70_000_000, termOfPayment: "4x (40-30-20-10)", installmentNo: 3, installmentType: "UAT", percentage: 20, amountDue: 14_000_000, terminDueDate: "2026-04-04", status: "Upcoming" },
  { id: "tm-027", projectCode: "PRJ-25/UBS/NLYRPRMNTMTN-0028", projectName: "Analyse & Repairment MTN Module Scada", clientName: "UBS GOLD", totalProjectValue: 70_000_000, termOfPayment: "4x (40-30-20-10)", installmentNo: 4, installmentType: "BAST", percentage: 10, amountDue: 7_000_000, terminDueDate: "2026-06-04", status: "Pending" },
];
