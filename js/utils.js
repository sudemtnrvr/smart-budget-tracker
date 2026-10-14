let currentTransType = 'expense';
let expenseChartInstance = null;
let testDateOverride = null;
if (typeof window !== 'undefined') {
    window.testDateOverride = testDateOverride;
}
let currentListIdForProduct = null;

function getToday() {
    if (testDateOverride) {
        return new Date(testDateOverride);
    }
    return new Date();
}

function getCurrentUserApiKey() {
    if (!DB.currentUser) return null;
    return DB.userApiKeys[DB.currentUser.id] || null;
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function addWeeks(date, weeks) {
    return addDays(date, weeks * 7);
}

function addMonths(date, months) {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== day) {
        d.setDate(0);
    }
    return d;
}

