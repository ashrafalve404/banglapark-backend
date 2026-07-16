export declare class QuestionDto {
    question: string;
    options: string[];
    correctIndex: number;
    sortOrder?: number;
}
export declare class CreateQuizDto {
    title: string;
    price: number;
    timeLimit?: number;
    isActive?: boolean;
    questions: QuestionDto[];
}
export declare class UpdateQuizDto {
    title?: string;
    price?: number;
    timeLimit?: number;
    isActive?: boolean;
}
export declare class SubmitQuizDto {
    answers: {
        questionId: string;
        selectedIndex: number;
    }[];
}
