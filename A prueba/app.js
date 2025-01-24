import { auth, database } from "../environment/firebaseConfig.js";
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Inicializar gráfico
const ctx = document.getElementById('dataChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Valores',
            data: [],
            borderColor: 'blue',
            borderWidth: 2
        }]
    }
});

// Función para actualizar el gráfico
const updateChart = (labels, data) => {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
};

// Escuchar el estado de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario autenticado
        const userId = user.uid;
        const dataRef = ref(database, `users/${userId}/productData`);

        // Escuchar nuevos datos en Firebase
        onValue(dataRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const labels = Object.keys(data);
                const values = Object.values(data);
                updateChart(labels, values);
                makePrediction(values);
            }
        });

        // Manejar envío del formulario
        document.getElementById('dataForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const value = document.getElementById('dataInput').value;
            if (value) {
                const timestamp = Date.now();
                set(ref(database, `users/${userId}/productData/${timestamp}`), Number(value));
                document.getElementById('dataInput').value = '';
            }
        });
    } else {
        // Usuario no autenticado
        console.log('No hay usuario autenticado. Por favor, inicia sesión.');
    }
});

// Modelo de TensorFlow.js
const model = tf.sequential();
model.add(tf.layers.dense({ inputShape: [1], units: 1 }));
model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

// Función para hacer predicciones
const makePrediction = (data) => {
    if (data.length > 1) {
        const xs = tf.tensor(data.map((_, i) => i), [data.length, 1]);
        const ys = tf.tensor(data, [data.length, 1]);
        model.fit(xs, ys, { epochs: 10 }).then(() => {
            const nextValue = tf.tensor([data.length]);
            const prediction = model.predict(nextValue).dataSync()[0];
            document.getElementById('prediction').innerText = prediction.toFixed(2);
        });
    }
};
