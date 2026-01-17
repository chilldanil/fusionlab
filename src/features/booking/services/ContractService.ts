import { jsPDF } from 'jspdf';
import type { BookingRecord } from './BookingService';

export type ContractLanguage = 'en' | 'de';

interface UserInfo {
    id: string;
    fullName: string;
    email: string;
}

interface ZoneInfo {
    name: string;
    type: string;
    capacity?: number;
}

const TRANSLATIONS = {
    en: {
        title: 'WORKSPACE RENTAL AGREEMENT',
        agreementNo: 'Agreement No',
        tenantInfo: 'TENANT INFORMATION',
        fullName: 'Full Name',
        email: 'Email',
        userId: 'User ID',
        rentalObject: 'RENTAL OBJECT',
        zone: 'Zone',
        seat: 'Seat',
        type: 'Type',
        capacity: 'Capacity',
        persons: 'persons',
        rentalPeriod: 'RENTAL PERIOD',
        date: 'Date',
        timeSlot: 'Time Slot',
        checkIn: 'Check-in',
        pending: 'Pending',
        termsTitle: 'TERMS OF RESPONSIBILITY',
        term1Title: '1. ACCEPTANCE OF RESPONSIBILITY',
        term1Text: 'Upon check-in, the Tenant accepts full responsibility for the condition of the rented workspace and all equipment contained therein.',
        term2Title: '2. DURATION OF LIABILITY',
        term2Text: 'Responsibility begins at check-in and continues until:',
        term2a: 'a) Next tenant confirms acceptable handoff condition',
        term2b: 'b) Rental period ends with no subsequent booking',
        term2c: 'c) Facility management confirms workspace condition',
        term3Title: '3. DAMAGE REPORTING',
        term3Text: 'Pre-existing damage must be reported immediately upon check-in. Failure to report constitutes acceptance of the current condition.',
        term4Title: '4. RETURN CONDITION',
        term4Text: 'The Tenant agrees to return the workspace in the same condition as received, allowing for reasonable wear.',
        signatureTitle: 'DIGITAL SIGNATURE',
        signedAt: 'Electronically signed upon check-in',
        timestamp: 'Timestamp',
        signatory: 'Signatory',
        footer: 'This document is automatically generated and constitutes a legally binding record of the rental agreement.',
        privateZone: 'Private Zone - Full Access',
        generated: 'Generated',
    },
    de: {
        title: 'ARBEITSPLATZ-MIETVERTRAG',
        agreementNo: 'Vertragsnummer',
        tenantInfo: 'MIETERINFORMATIONEN',
        fullName: 'Vollständiger Name',
        email: 'E-Mail',
        userId: 'Benutzer-ID',
        rentalObject: 'MIETOBJEKT',
        zone: 'Zone',
        seat: 'Arbeitsplatz',
        type: 'Typ',
        capacity: 'Kapazität',
        persons: 'Personen',
        rentalPeriod: 'MIETDAUER',
        date: 'Datum',
        timeSlot: 'Zeitfenster',
        checkIn: 'Check-in',
        pending: 'Ausstehend',
        termsTitle: 'VERANTWORTUNGSBEDINGUNGEN',
        term1Title: '1. ÜBERNAHME DER VERANTWORTUNG',
        term1Text: 'Mit dem Check-in übernimmt der Mieter die volle Verantwortung für den Zustand des gemieteten Arbeitsplatzes und aller darin befindlichen Geräte.',
        term2Title: '2. DAUER DER HAFTUNG',
        term2Text: 'Die Verantwortung beginnt mit dem Check-in und dauert an bis:',
        term2a: 'a) Der nächste Mieter einen akzeptablen Übergabezustand bestätigt',
        term2b: 'b) Die Mietzeit ohne nachfolgende Buchung endet',
        term2c: 'c) Die Gebäudeverwaltung den Zustand bestätigt',
        term3Title: '3. SCHADENSMELDUNG',
        term3Text: 'Bereits vorhandene Schäden müssen sofort beim Check-in gemeldet werden. Unterlassene Meldung gilt als Akzeptanz des aktuellen Zustands.',
        term4Title: '4. RÜCKGABEZUSTAND',
        term4Text: 'Der Mieter verpflichtet sich, den Arbeitsplatz im gleichen Zustand zurückzugeben, wie er ihn erhalten hat, unter Berücksichtigung normaler Abnutzung.',
        signatureTitle: 'DIGITALE UNTERSCHRIFT',
        signedAt: 'Elektronisch unterzeichnet beim Check-in',
        timestamp: 'Zeitstempel',
        signatory: 'Unterzeichner',
        footer: 'Dieses Dokument wurde automatisch erstellt und stellt eine rechtlich verbindliche Aufzeichnung des Mietvertrags dar.',
        privateZone: 'Private Zone - Vollzugang',
        generated: 'Erstellt',
    },
};

const TYPE_LABELS: Record<string, { en: string; de: string }> = {
    'desk-1p': { en: '1-Person Desk', de: 'Einzelarbeitsplatz' },
    'desk-double': { en: 'Double Desk (2 persons)', de: 'Doppelarbeitsplatz (2 Personen)' },
    'desk-3p-round': { en: '3-Person Round Desk', de: 'Rundtisch (3 Personen)' },
    'table-6p-share': { en: '6-Person Shared Work Table', de: 'Gemeinschaftstisch (6 Personen)' },
    'private-zone': { en: 'Private Zone', de: 'Private Zone' },
};

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
};

const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().replace('T', ' ').replace('Z', ' UTC');
};

export const ContractService = {
    generatePDF(
        booking: BookingRecord,
        user: UserInfo,
        zone: ZoneInfo,
        language: ContractLanguage = 'en',
    ): void {
        const t = TRANSLATIONS[language];
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const contentWidth = pageWidth - margin * 2;
        let y = 20;

        const addLine = (height = 0.3) => {
            doc.setDrawColor(0);
            doc.setLineWidth(height);
            doc.line(margin, y, pageWidth - margin, y);
            y += 3;
        };

        const addSection = (title: string) => {
            y += 5;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(title, margin, y);
            y += 2;
            addLine(0.2);
            y += 3;
        };

        const addField = (label: string, value: string) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`${label}:`, margin, y);
            doc.setFont('helvetica', 'bold');
            doc.text(value, margin + 45, y);
            y += 6;
        };

        const addParagraph = (text: string, indent = 0) => {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(text, contentWidth - indent);
            doc.text(lines, margin + indent, y);
            y += lines.length * 4.5;
        };

        const addTermTitle = (text: string) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(text, margin, y);
            y += 5;
        };

        // Header
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, pageWidth, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(t.title, pageWidth / 2, 18, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${t.agreementNo}: ${booking.id}`, pageWidth / 2, 28, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        y = 45;

        // Tenant Information
        addSection(t.tenantInfo);
        addField(t.fullName, user.fullName || 'N/A');
        addField(t.email, user.email || 'N/A');
        addField(t.userId, user.id);

        // Rental Object
        addSection(t.rentalObject);
        addField(t.zone, booking.zone_id);
        addField(t.seat, booking.seat_id || t.privateZone);
        const typeLabel = TYPE_LABELS[zone.type]?.[language] || zone.type;
        addField(t.type, typeLabel);
        if (zone.capacity) {
            addField(t.capacity, `${zone.capacity} ${t.persons}`);
        }

        // Rental Period
        addSection(t.rentalPeriod);
        addField(t.date, formatDate(booking.booking_date));
        addField(t.timeSlot, booking.slot_label);
        addField(
            t.checkIn,
            booking.arrival_confirmed_at
                ? formatDateTime(booking.arrival_confirmed_at)
                : t.pending,
        );

        // Terms of Responsibility
        addSection(t.termsTitle);

        addTermTitle(t.term1Title);
        addParagraph(t.term1Text, 5);
        y += 2;

        addTermTitle(t.term2Title);
        addParagraph(t.term2Text, 5);
        addParagraph(t.term2a, 10);
        addParagraph(t.term2b, 10);
        addParagraph(t.term2c, 10);
        y += 2;

        addTermTitle(t.term3Title);
        addParagraph(t.term3Text, 5);
        y += 2;

        addTermTitle(t.term4Title);
        addParagraph(t.term4Text, 5);

        // Digital Signature
        y += 5;
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, contentWidth, 35, 'F');
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(margin, y, contentWidth, 35, 'S');

        y += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(t.signatureTitle, margin + 5, y);
        y += 7;

        if (booking.arrival_confirmed_at) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`✓ ${t.signedAt}`, margin + 5, y);
            y += 6;
            doc.text(`${t.timestamp}: ${formatDateTime(booking.arrival_confirmed_at)}`, margin + 5, y);
            y += 5;
            doc.text(`${t.signatory}: ${user.fullName} (${user.id.slice(0, 8)}...)`, margin + 5, y);
        } else {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text(`⏳ ${t.pending}`, margin + 5, y);
        }

        // Footer
        y = doc.internal.pageSize.getHeight() - 25;
        doc.setDrawColor(200);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        const footerLines = doc.splitTextToSize(t.footer, contentWidth);
        doc.text(footerLines, pageWidth / 2, y, { align: 'center' });

        y += footerLines.length * 3 + 3;
        doc.setFont('helvetica', 'normal');
        doc.text(
            `${t.generated}: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`,
            pageWidth / 2,
            y,
            { align: 'center' },
        );

        // Save
        const fileName = `contract_${booking.id.slice(0, 8)}_${language.toUpperCase()}.pdf`;
        doc.save(fileName);
    },
};
