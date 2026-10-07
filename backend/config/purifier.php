<?php

return [

    /*
     |--------------------------------------------------------------------------
     | HTML Purifier Encoding
     |--------------------------------------------------------------------------
     |
     | This value is the default encoding used by HTML Purifier.
     |
     */
    'encoding' => 'UTF-8',

    /*
     |--------------------------------------------------------------------------
     | HTML Purifier Finalize
     |--------------------------------------------------------------------------
     |
     | This value determines whether HTMLPurifier automatically finalizes
     | the HTMLPurifier_Config object.
     |
     */
    'finalize' => true,

    /*
     |--------------------------------------------------------------------------
     | HTML Purifier Cache Path
     |--------------------------------------------------------------------------
     |
     | This value is the path to the HTML Purifier cache directory, needed to
     | store definitions and other data.
     |
     */
    'cachePath' => storage_path('app/purifier'),

    'cacheFileMode' => 0755,

    /*
     |--------------------------------------------------------------------------
     | HTML Purifier Settings
     |--------------------------------------------------------------------------
     |
     | Configuration profiles used by Purifier::clean($dirty, $config).
     | 'default' is used when no config name is passed explicitly.
     |
     */
    'settings'    => [
        'default' => [
            'HTML.Doctype'             => 'HTML 4.01 Transitional',
            'HTML.Allowed'             => 'p,br,b,i,u,strong,em,ul,ol,li,hr,span[style]',
            'CSS.AllowedProperties'    => 'color,font-size',
            'AutoFormat.AutoParagraph' => false,
            'AutoFormat.RemoveEmpty'   => true,
        ],
        'youtube' => [
            'HTML.SafeIframe'                 => 'true',
            'URI.SafeIframeRegexp'             => '%^(https?:)?//(www\.youtube(?:-nocookie)?\.com/embed/|player\.vimeo\.com/video/)%',
        ],
        'test' => [
            'Attr.EnableID' => 'true',
        ],
        'custom_definition' => [
            'id'      => 'html5-definitions',
            'rev'     => 1,
            'debug'   => false,
            'elements' => [
                // http://developers.whatwg.org/sections.html
                ['section', 'Block', 'Flow', 'Common'],
                ['nav',     'Block', 'Flow', 'Common'],
                ['article', 'Block', 'Flow', 'Common'],
                ['aside',   'Block', 'Flow', 'Common'],
                ['header',  'Block', 'Flow', 'Common'],
                ['footer',  'Block', 'Flow', 'Common'],

                // Content model actually excludes several tags, not modelled here
                ['address', 'Block', 'Flow', 'Common'],
                ['hgroup', 'Block', 'Required: h1 | h2 | h3 | h4 | h5 | h6', 'Common'],

                // http://developers.whatwg.org/grouping-content.html
                ['figure', 'Block', 'Optional: (figcaption, Flow) | (Flow, figcaption) | Flow', 'Common'],
                ['figcaption', 'Inline', 'Flow', 'Common'],

                // http://developers.whatwg.org/the-video-element.html#the-video-element
                ['video', 'Block', 'Optional: (source, Flow) | (Flow, source) | Flow', 'Common', [
                    'src'      => 'URI',
                    'type'     => 'Text',
                    'width'    => 'Length',
                    'height'   => 'Length',
                    'poster'   => 'URI',
                    'preload'  => 'Enum#auto,metadata,none',
                    'controls' => 'Bool',
                ]],
                ['source', 'Block', 'Flow', 'Common', [
                    'src'  => 'URI',
                    'type' => 'Text',
                ]],

                // http://developers.whatwg.org/text-level-semantics.html
                ['s',    'Inline', 'Inline', 'Common'],
                ['var',  'Inline', 'Inline', 'Common'],
                ['sub',  'Inline', 'Inline', 'Common'],
                ['sup',  'Inline', 'Inline', 'Common'],
                ['mark', 'Inline', 'Inline', 'Common'],
                ['wbr',  'Inline', 'Empty', 'Core'],

                // http://developers.whatwg.org/edits.html
                ['ins', 'Block', 'Flow', 'Common', ['cite' => 'URI', 'datetime' => 'CDATA']],
                ['del', 'Block', 'Flow', 'Common', ['cite' => 'URI', 'datetime' => 'CDATA']],
            ],
            'attributes' => [
                ['iframe', 'allowfullscreen', 'Bool'],
                ['table', 'height', 'Text'],
                ['td', 'border', 'Text'],
                ['th', 'border', 'Text'],
                ['tr', 'width', 'Text'],
                ['tr', 'height', 'Text'],
                ['tr', 'border', 'Text'],
            ],
        ],
        'custom_attributes' => [
            ['a', 'target', 'Enum#_blank,_self,_target,_top'],
        ],
        'custom_elements' => [
            ['u', 'Inline', 'Inline', 'Common'],
        ],
    ],

    /*
     |--------------------------------------------------------------------------
     | HTML Purifier Custom Definition Id and Revision
     |--------------------------------------------------------------------------
     |
     | If you add a custom element to the definitions, you *must* increment
     | this value.
     |
     */
    'custom_attributes' => [
        // ['a', 'target', 'Enum#_blank,_self,_target,_top'],
    ],
    'custom_elements' => [
        // ['u', 'Inline', 'Inline', 'Common'],
    ],
];
