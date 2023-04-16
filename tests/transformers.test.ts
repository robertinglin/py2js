import py2js from "../src/py2js";
jest.setTimeout(60000);

test("transformers", async () => {
  const py = py2js();

  py("transformers");
  const AutoTokenizer = py("AutoTokenizer", "transformers");
  const BartForConditionalGeneration = py(
    "BartForConditionalGeneration",
    "transformers"
  );

  const tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-cnn");

  const model = BartForConditionalGeneration.from_pretrained(
    "facebook/bart-large-cnn"
  );

  const ARTICLE_TO_SUMMARIZE = `
    PG&E stated it scheduled the blackouts in response to forecasts for high winds 
    amid dry conditions. The aim is to reduce the risk of wildfires. Nearly 800 thousand customers were 
    scheduled to be affected by the shutoffs which were expected to last through at least midday tomorrow.
`;
  const inputs = tokenizer([ARTICLE_TO_SUMMARIZE], {
    "=max_length": 1024,
    "=return_tensors": "pt",
  });

  const summary_ids = model.generate(inputs.input_ids, {
    "=num_beams": 2,
    "=min_length": 0,
    "=max_length": 120,
  });
  const summary = tokenizer.batch_decode(summary_ids, {
    "=skip_special_tokens": true,
    "=clean_up_tokenization_spaces": false,
  });

  const res = await summary.__get();
  console.log(res);
  expect(res).not.toBeNull();

  py.end();
});
