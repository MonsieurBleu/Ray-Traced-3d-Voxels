#version 460

uniform sampler2D mainscreen;
layout (location = 0) uniform ivec2 iResolution;

out vec4 frag_color;

void main()
{
    frag_color = texture(mainscreen, gl_FragCoord.xy/iResolution.xy);

    // frag_color = vec4(1.0);

    // frag_color.rg = gl_FragCoord.xy/iResolution.xy;
}
