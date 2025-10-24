export interface JournalTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
    tags: string[];
}
export declare const journalTemplates: JournalTemplate[];
export declare const getTemplateById: (id: string) => JournalTemplate | undefined;
export declare const getTemplatesByTags: (tags: string[]) => JournalTemplate[];
