export async function migratePurchaseData(user) {
    const userEmailKey = user.email.replaceAll(".", "_");
    const oldRef = ref(database, `users/${userEmailKey}/recordData/purchaseData`);
    const snapshot = await get(oldRef);

    if (!snapshot.exists()) return;

    snapshot.forEach(async (purchaseSnapshot) => {
        const purchaseData = purchaseSnapshot.val();
        const [year, month, day] = purchaseData.fecha.split("-");

        const newRef = ref(
            database,
            `users/${userEmailKey}/recordData/purchaseData/${year}/${month}/${day}/${purchaseSnapshot.key}`
        );

        await update(newRef, { factura: purchaseData.factura });
        await remove(purchaseSnapshot.ref);
    });
}

// Ejecutar al autenticarse
auth.onAuthStateChanged((user) => {
    if (user) {
        migratePurchaseData(user);
        initializeUserSession(user);
    }
});