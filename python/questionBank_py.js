const questionBank = {
    basic: [
        {
            id: 'b1',
            level: 'A1',
            type: 'Sintaxe Básica',
            question: 'Qual é a forma correta de imprimir "Hello, World" em Python?',
            options: ['echo("Hello, World")', 'print("Hello, World")', 'printf("Hello, World")', 'console.log("Hello, World")'],
            correct: 1
        },
        {
            id: 'b2',
            level: 'A1',
            type: 'Tipos de Dados',
            question: 'Qual tipo de dado representa números inteiros em Python?',
            options: ['str', 'float', 'int', 'bool'],
            correct: 2
        },
        {
            id: 'b3',
            level: 'A1',
            type: 'Variáveis',
            question: 'Qual dessas é uma variável válida em Python?',
            options: ['2variavel', 'variavel_nome', 'var-nome', '#variavel'],
            correct: 1
        },
        {
            id: 'b4',
            level: 'A2',
            type: 'Operadores',
            question: 'Qual operador é usado para multiplicação em Python?',
            options: ['x', '*', '×', '%'],
            correct: 1
        },
        {
            id: 'b5',
            level: 'A2',
            type: 'Operadores',
            question: 'Qual operador retorna o resto da divisão?',
            options: ['//', '%', '/', '**'],
            correct: 1
        },
        {
            id: 'b6',
            level: 'A2',
            type: 'Funções',
            question: 'Como se define uma função em Python?',
            options: ['function minha_func():', 'def minha_func():', 'func minha_func():', 'define minha_func():'],
            correct: 1
        },
        {
            id: 'b7',
            level: 'A2',
            type: 'Listas',
            question: 'Qual é o índice do primeiro elemento de uma lista em Python?',
            options: ['1', '0', '-1', 'Não existe índice'],
            correct: 1
        },
        {
            id: 'b8',
            level: 'A1',
            type: 'Comentários',
            question: 'Como se escreve um comentário de linha única em Python?',
            options: ['// comentário', '# comentário', '/* comentário */', '-- comentário'],
            correct: 1
        },
        {
            id: 'b9',
            level: 'A1',
            type: 'Strings',
            question: 'Qual destas opções cria uma string em Python?',
            options: ['"texto"', 'texto', '`texto`', 'str(texto)'],
            correct: 0
        },
        {
            id: 'b10',
            level: 'A2',
            type: 'Entrada de Dados',
            question: 'Qual função lê dados do usuário no console?',
            options: ['input()', 'read()', 'scanf()', 'get()'],
            correct: 0
        }
    ],
    intermediate: [
        {
            id: 'i1',
            level: 'B1',
            type: 'Condicionais',
            question: 'Qual estrutura é usada para decisões em Python?',
            options: ['switch', 'if-else', 'for', 'while'],
            correct: 1
        },
        {
            id: 'i2',
            level: 'B1',
            type: 'Loops',
            question: 'Qual loop percorre elementos de uma lista diretamente?',
            options: ['for item in lista:', 'while lista:', 'foreach lista:', 'loop lista:'],
            correct: 0
        },
        {
            id: 'i3',
            level: 'B1',
            type: 'Listas',
            question: 'Como se adiciona um elemento ao final de uma lista?',
            options: ['append()', 'add()', 'insert()', 'extend()'],
            correct: 0
        },
        {
            id: 'i4',
            level: 'B2',
            type: 'Dicionários',
            question: 'Como se acessa o valor associado à chave "nome" em um dicionário "pessoa"?',
            options: ['pessoa["nome"]', 'pessoa.nome', 'pessoa(nome)', 'pessoa.get("nome")'],
            correct: 0
        },
        {
            id: 'i5',
            level: 'B2',
            type: 'Funções',
            question: 'Qual palavra-chave retorna um valor de uma função?',
            options: ['give', 'return', 'yield', 'output'],
            correct: 1
        },
        {
            id: 'i6',
            level: 'B1',
            type: 'Importação de Módulos',
            question: 'Como se importa o módulo "math" em Python?',
            options: ['import math', 'include math', 'require math', 'using math'],
            correct: 0
        },
        {
            id: 'i7',
            level: 'B2',
            type: 'Manipulação de Strings',
            question: 'Qual método transforma todos os caracteres de uma string em maiúsculas?',
            options: ['upper()', 'capitalize()', 'title()', 'uppercase()'],
            correct: 0
        },
        {
            id: 'i8',
            level: 'B2',
            type: 'Listas Avançadas',
            question: 'Qual expressão retorna os elementos pares de uma lista usando list comprehension?',
            options: ['[x for x in lista if x % 2 == 0]', '[x for x in lista if x % 2]', '[x in lista if x % 2 == 0]', 'lista.filter(x % 2 == 0)'],
            correct: 0
        },
        {
            id: 'i9',
            level: 'B1',
            type: 'Exceções',
            question: 'Qual palavra-chave é usada para tratar exceções?',
            options: ['try-except', 'catch', 'handle', 'error'],
            correct: 0
        },
        {
            id: 'i10',
            level: 'B2',
            type: 'Arquivos',
            question: 'Qual modo abre um arquivo para leitura em Python?',
            options: ['"r"', '"w"', '"a"', '"rw"'],
            correct: 0
        }
    ],
    advanced: [
        {
            id: 'a1',
            level: 'C1',
            type: 'Decoradores',
            question: 'O que um decorator faz em Python?',
            options: [
                'Modifica o comportamento de uma função',
                'Cria uma nova função automaticamente',
                'Serve apenas para classes',
                'É usado para loops'
            ],
            correct: 0
        },
        {
            id: 'a2',
            level: 'C1',
            type: 'Geradores',
            question: 'Qual palavra-chave é usada para criar um gerador?',
            options: ['generate', 'yield', 'return', 'next'],
            correct: 1
        },
        {
            id: 'a3',
            level: 'C1',
            type: 'Classes',
            question: 'Como se define um método construtor em uma classe Python?',
            options: ['def __init__(self):', 'def constructor():', 'def new():', 'def create(self):'],
            correct: 0
        },
        {
            id: 'a4',
            level: 'C2',
            type: 'Metaclasses',
            question: 'Metaclasses são usadas principalmente para:',
            options: [
                'Controlar a criação de classes',
                'Criar instâncias de objetos',
                'Gerar números aleatórios',
                'Gerenciar memória'
            ],
            correct: 0
        },
        {
            id: 'a5',
            level: 'C2',
            type: 'Expressões Lambda',
            question: 'Qual expressão cria uma função anônima que soma dois números?',
            options: ['lambda x, y: x + y', 'def(x, y): x + y', 'func(x, y) => x + y', 'lambda(x + y)'],
            correct: 0
        },
        {
            id: 'a6',
            level: 'C1',
            type: 'Manipulação Avançada de Strings',
            question: 'Qual método formata strings usando placeholders modernos?',
            options: ['f-strings', 'printf', 'format()', 'concat()'],
            correct: 0
        },
        {
            id: 'a7',
            level: 'C2',
            type: 'Async/Await',
            question: 'Qual palavra-chave é usada para criar funções assíncronas?',
            options: ['async def', 'await', 'async function', 'defer'],
            correct: 0
        },
        {
            id: 'a8',
            level: 'C2',
            type: 'Comprehensions Complexas',
            question: 'Qual expressão cria um dicionário {n: n*n} para n de 1 a 5?',
            options: [
                '{n: n*n for n in range(1,6)}',
                '{n*n for n in range(1,6)}',
                'dict((n, n*n) for n in range(1,6))',
                'Both A and C'
            ],
            correct: 3
        },
        {
            id: 'a9',
            level: 'C1',
            type: 'Manipulação de Arquivos',
            question: 'Como você abre um arquivo para escrita binária?',
            options: ['"wb"', '"rb"', '"w"', '"ab"'],
            correct: 0
        },
        {
            id: 'a10',
            level: 'C2',
            type: 'Typing e Annotations',
            question: 'Qual é a sintaxe correta para indicar que uma função retorna um inteiro?',
            options: ['def func() -> int:', 'def func(): int', 'def func(int):', 'func(): int'],
            correct: 0
        }
    ]
};
