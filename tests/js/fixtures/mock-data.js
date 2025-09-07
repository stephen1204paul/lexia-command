/**
 * Mock data and fixtures for testing
 */

export const mockPages = [
    {
        id: 1,
        title: 'Home Page',
        slug: 'home',
        status: 'publish',
        url: 'http://localhost/',
        excerpt: 'Welcome to our website',
        date: '2024-01-01',
    },
    {
        id: 2,
        title: 'About Us',
        slug: 'about',
        status: 'publish',
        url: 'http://localhost/about/',
        excerpt: 'Learn more about our company',
        date: '2024-01-02',
    },
    {
        id: 3,
        title: 'Contact',
        slug: 'contact',
        status: 'publish',
        url: 'http://localhost/contact/',
        excerpt: 'Get in touch with us',
        date: '2024-01-03',
    },
    {
        id: 4,
        title: 'Services',
        slug: 'services',
        status: 'draft',
        url: 'http://localhost/services/',
        excerpt: 'Our services and offerings',
        date: '2024-01-04',
    },
];

export const mockPosts = [
    {
        id: 101,
        title: 'First Blog Post',
        slug: 'first-blog-post',
        status: 'publish',
        url: 'http://localhost/first-blog-post/',
        excerpt: 'This is our first blog post',
        date: '2024-01-10',
        author: 'Admin',
    },
    {
        id: 102,
        title: 'Second Blog Post',
        slug: 'second-blog-post',
        status: 'publish',
        url: 'http://localhost/second-blog-post/',
        excerpt: 'Another interesting article',
        date: '2024-01-11',
        author: 'Editor',
    },
    {
        id: 103,
        title: 'Draft Post',
        slug: 'draft-post',
        status: 'draft',
        url: 'http://localhost/draft-post/',
        excerpt: 'This post is still in draft',
        date: '2024-01-12',
        author: 'Author',
    },
];

export const mockPlugins = [
    {
        slug: 'akismet',
        name: 'Akismet Anti-Spam',
        version: '5.0.0',
        author: 'Automattic',
        description: 'Used by millions, Akismet is quite possibly the best way in the world to protect your blog from spam.',
        rating: 4.5,
        num_ratings: 1000,
        active_installs: 5000000,
        download_link: 'https://downloads.wordpress.org/plugin/akismet.5.0.0.zip',
        status: 'active',
    },
    {
        slug: 'contact-form-7',
        name: 'Contact Form 7',
        version: '5.8.0',
        author: 'Takayuki Miyoshi',
        description: 'Just another contact form plugin. Simple but flexible.',
        rating: 4.2,
        num_ratings: 2000,
        active_installs: 5000000,
        download_link: 'https://downloads.wordpress.org/plugin/contact-form-7.5.8.0.zip',
        status: 'inactive',
    },
    {
        slug: 'wordpress-seo',
        name: 'Yoast SEO',
        version: '21.0',
        author: 'Team Yoast',
        description: 'Improve your WordPress SEO: Write better content and have a fully optimized WordPress site.',
        rating: 4.8,
        num_ratings: 5000,
        active_installs: 5000000,
        download_link: 'https://downloads.wordpress.org/plugin/wordpress-seo.21.0.zip',
        status: 'not-installed',
    },
];

export const mockCommandResults = [
    {
        id: 'create-page',
        type: 'CREATE',
        category: 'CONTENT',
        title: 'Create a new page',
        keywords: ['new page', 'add page', 'create page'],
        icon: '📄',
    },
    {
        id: 'create-post',
        type: 'CREATE',
        category: 'CONTENT',
        title: 'Create a new post',
        keywords: ['new post', 'add post', 'create post', 'write'],
        icon: '✏️',
    },
    {
        id: 'media-library',
        type: 'MANAGE',
        category: 'CONTENT',
        title: 'Open Media Library',
        keywords: ['media', 'images', 'library', 'files'],
        icon: '🖼️',
    },
];

export const mockPluginStatuses = {
    'akismet/akismet.php': 'active',
    'contact-form-7/wp-contact-form-7.php': 'inactive',
    'hello-dolly/hello.php': 'inactive',
};

export const mockUserCapabilities = {
    administrator: {
        manage_options: true,
        edit_posts: true,
        edit_pages: true,
        upload_files: true,
        activate_plugins: true,
        install_plugins: true,
        edit_themes: true,
        install_themes: true,
        update_core: true,
        list_users: true,
        remove_users: true,
        add_users: true,
        promote_users: true,
        delete_themes: true,
        export: true,
        edit_users: true,
    },
    editor: {
        manage_options: false,
        edit_posts: true,
        edit_pages: true,
        upload_files: true,
        activate_plugins: false,
        install_plugins: false,
        edit_themes: false,
        install_themes: false,
        update_core: false,
        list_users: true,
        remove_users: false,
        add_users: false,
        promote_users: false,
        delete_themes: false,
        export: true,
        edit_users: false,
    },
    author: {
        manage_options: false,
        edit_posts: true,
        edit_pages: false,
        upload_files: true,
        activate_plugins: false,
        install_plugins: false,
        edit_themes: false,
        install_themes: false,
        update_core: false,
        list_users: false,
        remove_users: false,
        add_users: false,
        promote_users: false,
        delete_themes: false,
        export: false,
        edit_users: false,
    },
};

export const mockAPIResponses = {
    'lexia-command/v1/search': {
        success: true,
        data: {
            results: mockPosts,
            total: mockPosts.length,
            page: 1,
            per_page: 10,
        },
    },
    'lexia-command/v1/install-plugin': {
        success: true,
        message: 'Plugin installed successfully',
        plugin: mockPlugins[2],
    },
    'lexia-command/v1/activate-plugin': {
        success: true,
        message: 'Plugin activated successfully',
        status: 'active',
    },
    'lexia-command/v1/get-plugin-statuses': {
        success: true,
        statuses: mockPluginStatuses,
    },
};

export const mockSearchQueries = {
    pages: ['home', 'about', 'contact', 'services', 'page'],
    posts: ['blog', 'post', 'article', 'news', 'update'],
    plugins: ['seo', 'contact', 'security', 'cache', 'backup'],
    commands: ['create', 'new', 'add', 'edit', 'delete', 'manage'],
};