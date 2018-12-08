const fs = require('fs');
const parse = require('csv-parse');
const WPAPI = require('wpapi');
import Settings from "./settings"

const inputFile = 'data/pages.csv';

class ParsedCsvPageRow {
  id: string = null;
  sort: string = null;
  name: string = null;
  title: string = null;
  description: string = null;
  contents: string = null;
  page_category_id: string = null;
  status: string = null;
  url: string = null;
  draft: string = null;
  author_id: string = null;
  publish_begin: string = null;
  publish_end: string = null;
  modified: string = null;
  created: string = null;

  constructor(values: Object) {
    Object.assign(this, values);
  }
}

class PageQuery {
  date: string = null;
  slug: string = null;
  status: string = null;
  parent: number = null;
  title: string = null;
  content: string = null;
  author: number = null;
  comment_status: string = null;
  ping_status: string = null;

  constructor(values: Object) {
    Object.assign(this, values);
  }
}
class CsvParser {
  csvRows = [];

  constructPageQuery = (row) => {
    let date;
    if (row.publish_begin) {
      date = new Date(row.publish_begin);
    } else {
      date = new Date(row.created);
    }
    return new PageQuery({
      title: row.title,
      slug: row.name,
      content: row.contents,
      date: date,
      status: 'publish',
      comment_status: 'closed',
      ping_status: 'closed',
    });
  }

  insertPage = (pageQuery) => {
    wp.pages().create(pageQuery).then(function(response) {
      console.log('Page inserted with ID', response.id);
    }).catch(error => {
      console.error('Error posting page!', error);
    });
  }

  parse = () => {
    fs.createReadStream(inputFile)
    .pipe(parse({
      delimiter: config.csv_delimiter,
      escape: config.csv_escape,
    }))
    .on('data', (csvrow) => {
      this.csvRows.push(csvrow);
    })
    .on('end', () => {
      console.log('Processing ' + this.csvRows.length + ' rows (including header if present)')
      this.csvRows.forEach(csvrow => {
        var i = 0;
        let rowObject = new ParsedCsvPageRow({});
        for(var propertyName in rowObject) {
          if (rowObject.hasOwnProperty(propertyName)) {
            rowObject[propertyName] = csvrow[i];
          }
          i++;
        }
        if (rowObject.modified == '0000-00-00 00:00:00') {
          rowObject.modified = null;
        }
        if (rowObject.created == '0000-00-00 00:00:00') {
          rowObject.created = null;
        }
        if (rowObject.publish_begin == '0000-00-00 00:00:00') {
          rowObject.publish_begin = null;
        }
        if (rowObject.publish_end == '0000-00-00 00:00:00') {
          rowObject.publish_end = null;
        }
        if (rowObject.id != 'id') {
          // console.log(rowObject.id, rowObject.url, rowObject.title);
          const pageQuery = this.constructPageQuery(rowObject);
          this.insertPage(pageQuery);
        }
      });
    })
    .on('error', (err) => {
      console.log(err);
    });
  }
}

var config = new Settings();

var wp = new WPAPI({
    endpoint: config.endpoint,
    username: config.username,
    password: config.password,
});

let parser = new CsvParser();
parser.parse();
