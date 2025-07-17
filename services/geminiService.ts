
import { Employee, Task, FinanceData } from '../types';

interface AiContextData {
    employees: Employee[];
    tasks: Task[];
    financeData: FinanceData[];
}

/**
 * Gera uma análise baseada em IA chamando o endpoint de backend da aplicação.
 * @param userInput A pergunta do usuário.
 * @param contextData Os dados da aplicação (funcionários, tarefas, etc.).
 * @returns O texto da resposta da IA.
 * @throws Lançará um erro se a chamada da API falhar.
 */
export const getAiDataAnalysis = async (userInput: string, contextData: AiContextData): Promise<string> => {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userInput, contextData }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Ocorreu um erro desconhecido no servidor.' }));
            throw new Error(errorData.error || `O servidor respondeu com o status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.response) {
            throw new Error('A resposta da API estava em um formato inválido.');
        }

        return data.response;

    } catch (error: any) {
        console.error("Error calling /api/analyze:", error);
        throw new Error('Falha ao se comunicar com o serviço de IA. Verifique o console para detalhes.');
    }
};
