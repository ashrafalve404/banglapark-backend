export declare class CreateQuestionDto {
    question: string;
    options: string[];
    correctIndex: number;
    sortOrder?: number;
}
export declare class PurchaseDto {
    questionCount: number;
    paymentMethod?: string;
    levelId?: string;
}
export declare class SubmitAnswerDto {
    questionId: string;
    selectedIndex: number;
}
