let categorias = JSON.parse(localStorage.getItem('categorias')) || [];
let produtos = JSON.parse(localStorage.getItem('produtos')) || [];

// ===== CARREGAR CATEGORIAS NO DROPDOWN =====
function carregarCategorias() {
    const categoriaSelect = document.getElementById('categoriaProduto');
    categoriaSelect.innerHTML = '<option value="">Escolha a categoria</option>';

    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        categoriaSelect.appendChild(option);
    });
}

// ===== CRIAR CATEGORIA =====
const formCategoria = document.getElementById('formCategoria');
if (formCategoria) {
    formCategoria.addEventListener('submit', e => {
        e.preventDefault();
        const nome = document.getElementById('novaCategoria').value.trim();
        if (nome && !categorias.includes(nome)) {
            categorias.push(nome);
            localStorage.setItem('categorias', JSON.stringify(categorias));
            carregarCategorias();
            formCategoria.reset();
        } else {
            alert('Categoria já existe ou está vazia!');
        }
    });
}

// ===== CADASTRAR PRODUTO =====
const formProduto = document.getElementById('formProduto');
if (formProduto) {
    formProduto.addEventListener('submit', e => {
        e.preventDefault();
        const nome = document.getElementById('nomeProduto').value.trim();
        const preco = parseFloat(document.getElementById('precoProduto').value.trim());
        const quantidade = parseInt(document.getElementById('quantidadeProduto').value.trim());
        const fornecedor = document.getElementById('fornecedorProduto').value.trim();
        const categoria = document.getElementById('categoriaProduto').value;

        if (nome && preco && quantidade && fornecedor && categoria) {
            const produto = {
                nome,
                preco,
                quantidade,
                fornecedor,
                categoria,
                data_compra: new Date().toISOString().split('T')[0]
            };
            produtos.push(produto);
            localStorage.setItem('produtos', JSON.stringify(produtos));
            atualizarDashboard();
            formProduto.reset();
        } else {
            alert('Preencha todos os campos!');
        }
    });
}

// ===== ATUALIZAR DASHBOARD =====
function atualizarDashboard() {
    const container = document.getElementById('dashboard');
    const totalGasto = document.getElementById('totalGasto');
    if (!container) return;
    container.innerHTML = '';
    let total = 0;
    let gastoPorCategoria = {};

    categorias.forEach(cat => {
        const secao = document.createElement('div');
        secao.classList.add('categoriaBloco');
        secao.innerHTML = `<h3>${cat}</h3>`;

        const lista = produtos.filter(p => p.categoria === cat);
        gastoPorCategoria[cat] = 0;

        lista.forEach(p => {
            const item = document.createElement('div');
            item.classList.add('produtoItem');
            item.innerHTML = `
                <div>
                    <strong>${p.nome}</strong> - R$${p.preco.toFixed(2)} - Qtd: ${p.quantidade} - ${p.fornecedor}
                </div>
                <button class="apagar">Apagar</button>
            `;
            item.querySelector('.apagar').addEventListener('click', () => {
                produtos = produtos.filter(prod => prod !== p);
                localStorage.setItem('produtos', JSON.stringify(produtos));
                atualizarDashboard();
            });
            secao.appendChild(item);
            total += p.preco * p.quantidade;
            gastoPorCategoria[cat] += p.preco * p.quantidade;
        });

        if (lista.length === 0) {
            const vazio = document.createElement('p');
            vazio.innerText = 'Nenhum produto nesta categoria';
            secao.appendChild(vazio);
        }

        container.appendChild(secao);
    });

    if (totalGasto) totalGasto.innerText = `Total gasto: R$ ${total.toFixed(2)}`;
    atualizarGrafico(gastoPorCategoria);
}

// ===== ATUALIZAR GRAFICO =====
function atualizarGrafico(dados) {
    const ctx = document.getElementById('graficoGastos').getContext('2d');
    if (window.graficoAtual) window.graficoAtual.destroy();

    window.graficoAtual = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(dados),
            datasets: [{
                label: 'Gasto por Categoria',
                data: Object.values(dados),
                backgroundColor: [
                    '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#17a2b8'
                ]
            }]
        },
        options: { responsive: true }
    });
}

// ===== CONFIGURAÇÃO DA CÂMERA (OCR) =====
const botaoCamera = document.getElementById('botaoCamera');
const cameraContainer = document.getElementById('cameraContainer');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const tirarFoto = document.getElementById('tirarFoto');
const confirmarOCR = document.getElementById('confirmarOCR');
const ocrResultado = document.getElementById('ocrResultado');

// Ativar a câmera
if (botaoCamera) {
    botaoCamera.addEventListener('click', function() {
        cameraContainer.style.display = 'block';
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                video.srcObject = stream;
            })
            .catch(function(error) {
                alert('Erro ao acessar a câmera: ' + error);
            });
    });
}

// Tirar foto
tirarFoto.addEventListener('click', function() {
    const contexto = canvas.getContext('2d');
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
    ocrResultado.textContent = 'Processando imagem...';
    Tesseract.recognize(
        canvas,
        'eng',
        { logger: (m) => console.log(m) }
    ).then(({ data: { text } }) => {
        ocrResultado.textContent = text;
        confirmarOCR.style.display = 'block';
    });
});

// Confirmar OCR e cadastrar produto
confirmarOCR.addEventListener('click', function() {
    const textoOCR = ocrResultado.textContent;
    const campos = textoOCR.split('\n');
    
    const nomeProduto = campos[0];
    const precoProduto = parseFloat(campos[1].replace('R$', '').trim());
    const quantidadeProduto = parseInt(campos[2].trim());

    if (nomeProduto && precoProduto && quantidadeProduto) {
        const produto = {
            nome: nomeProduto,
            preco: precoProduto,
            quantidade: quantidadeProduto,
            fornecedor: "Desconhecido",
            categoria: "Desconhecida",
            data_compra: new Date().toISOString().split('T')[0]
        };

        produtos.push(produto);
        localStorage.setItem('produtos', JSON.stringify(produtos));
        cameraContainer.style.display = 'none';
        atualizarDashboard();
    } else {
        alert('Erro ao processar a imagem!');
    }
});

atualizarDashboard(); // Atualizar dashboard no carregamento da página
carregarCategorias(); // Carregar categorias no dropdown
