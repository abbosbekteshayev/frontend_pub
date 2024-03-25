type TParsedQuestion = {
    question: string;
    options: {
        option: string;
        correct: boolean;
    }[];
    difficulty_level: number;
}

function parseHTMLQuestions(value: string) {
    const questions: TParsedQuestion[] = [{
        question: '',
        options: [],
        difficulty_level: 1
    }]

    let lastRowType = '?'

    for (const element of value.split('<p>')) {
        const cleanedElement = element.split('</p>')[0].trim();

        if (!cleanedElement.startsWith('=') && !cleanedElement.startsWith('+') && !cleanedElement.startsWith('?')) {
            if (lastRowType === '?') {
                questions[questions.length - 1].question += cleanedElement + '<br/>';
            }
            else {
                questions[questions.length - 1].options[questions[questions.length - 1].options.length - 1].option += '<br/>' + cleanedElement
            }
        }
        else if (!cleanedElement.startsWith('=') && !cleanedElement.startsWith('+')) {
            lastRowType = '?'

            let q = cleanedElement;
            let difficultyLevel: number;

            if(cleanedElement.startsWith('???')) {
                difficultyLevel = 3;
                q = cleanedElement.slice(3).trim();
            }
            else if(cleanedElement.startsWith('??')) {
                difficultyLevel = 2;
                q = cleanedElement.slice(2).trim();
            }
            else {
                difficultyLevel = 1;
                q = cleanedElement.slice(1).trim();
            }

            q += '<br/>';


            if (questions[questions.length - 1].options.length > 0) {
                questions.push({
                    question: q,
                    options: [],
                    difficulty_level: difficultyLevel
                })
            }
            else {
                questions[questions.length - 1].question += q;
                questions[questions.length - 1].difficulty_level = difficultyLevel;
            }
        }
        else if (cleanedElement.startsWith('+')) {
            lastRowType = '+'
            questions[questions.length - 1].options.push({
                option: cleanedElement.slice(1).trim(),
                correct: true
            })
        }
        else if (cleanedElement.startsWith('=')) {
            lastRowType = '='
            questions[questions.length - 1].options.push({
                option: cleanedElement.slice(1).trim(),
                correct: false
            })
        }
    }

    if (questions[questions.length - 1].options.length === 0) questions.pop();

    return questions;
}

export default parseHTMLQuestions;