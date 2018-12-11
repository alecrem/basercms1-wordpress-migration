export default class Settings {
  // Your WordPress REST API endpoint
  endpoint = 'http://your-site.com/wp-json';

  // WordPress Auth
  username = 'someusername';
  password = 'password';

  // CSV parser settings
  csv_delimiter = '♀';
  csv_escape = '\\';

  // Blog categories in your BaserCMS installation
  // Make sure you have categories with these slugs
  // in your WordPress installation
  categories = [
    {
      name: 'default', // Name field solely for your reference
      bc_id: 1,
      wp_id: 1,
    },
    {
      name: 'crt',
      bc_id: 2,
      wp_id: 3,
    },
  ];
}
