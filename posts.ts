const fs = require('fs');
const parse = require('csv-parse');
const WPAPI = require('wpapi');
import Settings from "./settings"

const inputFile = 'data/posts.csv';

class ParsedCsvPostRow {
  id: string = null;
  blog_content_id: string = null;
  no: string = null;
  name: string = null;
  content: string = null;
  detail: string = null;
  blog_category_id: string = null;
  categories: number[] = [];
  user_id: string = null;
  status: string = null;
  posts_date: string = null;
  content_draft: string = null;
  detail_draft: string = null;
  publish_begin: string = null;
  publish_end: string = null;
  created: string = null;
  modified: string = null;

  constructor(values: Object) {
    Object.assign(this, values);
  }
}

class PostQuery {
  date: string = null;
  slug: string = null;
  status: string = null;
  title: string = null;
  content: string = null;
  author: number = null;
  comment_status: string = null;
  ping_status: string = null;
  categories: number[] = [];

  constructor(values: Object) {
    Object.assign(this, values);
  }
}
class CsvParser {
  settings: Settings = new Settings();
  csvRows = [];
  queries: PostQuery[] = [];

  constructPostQuery = (row) => {
    let date;
    if (row.publish_begin) {
      date = new Date(row.publish_begin);
    } else {
      date = new Date(row.created);
    }
    return new PostQuery({
      title: row.name,
      slug: row.no,
      content: row.content,
      categories: row.categories,
      date: date,
      status: 'publish',
      comment_status: 'closed',
      ping_status: 'closed',
    });
  }

  insertPost = (PostQuery) => {
    return wp.posts().create(PostQuery).then(function(response) {
      console.log('Post inserted with ID', response.id);
    }).catch(error => {
      console.error('Error posting post!', error);
    });
  }

  parse = () => {
    fs.createReadStream(inputFile)
    .pipe(parse({
      delimiter: this.settings.csv_delimiter,
      escape: this.settings.csv_escape,
    }))
    .on('data', (csvrow) => {
      this.csvRows.push(csvrow);
    })
    .on('end', () => {
      console.log('Processing ' + this.csvRows.length + ' rows (including header if present)')
      this.csvRows.forEach(csvrow => {
        var i = 0;
        let rowObject = new ParsedCsvPostRow({});
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
        if (rowObject.blog_category_id) {
          const cats = this.settings.categories.filter(elem => {
            if (elem.bc_id == Number(rowObject.blog_category_id)) {
              return true;
            }
          });
          rowObject.categories = cats.map(cat => cat.wp_id);
        }
        if (rowObject.id != 'id') {
          const postQuery = this.constructPostQuery(rowObject);
          this.queries.push(postQuery);
        }
      });
      this.recursiveQuery(this.queries.shift());
    })
    .on('error', (err) => {
      console.log(err);
    });
  }

  recursiveQuery = (postQuery) => {
    if (postQuery) {
      console.log('Running postQuery', postQuery.slug);
      this.insertPost(postQuery).then(() => {
        console.log('Query successful. Remaining:', this.queries.length);
        this.recursiveQuery(this.queries.shift());
      });
    } else {
      console.log('All queries done');
    }
  }

}

let parser = new CsvParser();
let wp = new WPAPI({
    endpoint: parser.settings.endpoint,
    username: parser.settings.username,
    password: parser.settings.password,
});

parser.parse();
