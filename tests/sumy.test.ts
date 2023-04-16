import py2js from "../src/py2js";

test("numpy", async () => {
  const py = py2js();
  try {
    py("sumy");
    const PlaintextParser = py("PlaintextParser", "sumy.parsers.plaintext");
    // const TextRankSummarizer = py(
    //   "TextRankSummarizer",
    //   "sumy.summarizers.text_rank"
    // );
    const Tokenizer = py("Tokenizer", "sumy.nlp.tokenizers");

    const text = `
  Here's a block of text that we want to summarize. Summarization is a common task in natural language processing, and it involves condensing a long piece of text into a shorter summary that captures the most important information. There are many techniques for summarization, such as LSA, LexRank, and TextRank. In this script, we'll use the TextRank method to summarize our block of text.
  `;

    const parser = PlaintextParser.from_string(text, Tokenizer("english"));

    await parser.promise;

    // // Define the summarizer
    // const summarizer = TextRankSummarizer();

    // // Set the number of sentences in the summary
    // const num_sentences = 2;

    // // Summarize the text
    // const summary = summarizer(parser.document, num_sentences);

    // const res = await summary.__get(`x: str(x[0])`);

    // expect(res).toEqual(
    //   "Summarization is a common task in natural language processing, and it involves condensing a long piece of text into a shorter summary that captures the most important information."
    // );

    // // // @ts-ignore
    // // console.log(global.code as any);

    // const list = summary.__map("x: str(x)");

    // expect(await list.__get()).toEqual([
    //   "Summarization is a common task in natural language processing, and it involves condensing a long piece of text into a shorter summary that captures the most important information.",
    //   "In this script, we'll use the TextRank method to summarize our block of text.",
    // ]);
  } finally {
    py.end();
  }
});
